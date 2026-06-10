import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { createPeerConnection, createVolumeAnalyser, isWebRTCSupported } from '@/lib/webrtc';

export interface VoicePeer {
  socketId: string;
  userId?: string;
  username?: string;
  stream?: MediaStream;
  isMuted: boolean;
  isSpeaking: boolean;
}

export function useVoiceChat(socket: Socket | null, roomId: string | undefined) {
  const [isInVoice,  setIsInVoice]  = useState(false);
  const [isMuted,    setIsMuted]    = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [peers,      setPeers]      = useState<VoicePeer[]>([]);
  const [error,      setError]      = useState<string | null>(null);

  const localStreamRef  = useRef<MediaStream | null>(null);
  const peersRef        = useRef<Map<string, { pc: RTCPeerConnection; peer: VoicePeer }>>(new Map());
  const analyserRef     = useRef<ReturnType<typeof createVolumeAnalyser> | null>(null);

  const updatePeer = (socketId: string, patch: Partial<VoicePeer>) => {
    setPeers(prev => prev.map(p => p.socketId === socketId ? { ...p, ...patch } : p));
    const entry = peersRef.current.get(socketId);
    if (entry) entry.peer = { ...entry.peer, ...patch };
  };

  // Create a full RTCPeerConnection toward targetSocketId
  const createPC = useCallback((targetSocketId: string, userId?: string, username?: string) => {
    const pc = createPeerConnection();
    const peer: VoicePeer = { socketId: targetSocketId, userId, username, isMuted: false, isSpeaking: false };
    peersRef.current.set(targetSocketId, { pc, peer });
    setPeers(prev => [...prev.filter(p => p.socketId !== targetSocketId), peer]);

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit('voice:ice-candidate', { targetSocketId, candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      updatePeer(targetSocketId, { stream });
    };

    return pc;
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket event listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    // We just joined — existing peers listed here; we initiate offers to them
    const onRoomPeers = async ({ peers: existing }: { peers: { socketId: string }[] }) => {
      for (const { socketId } of existing) {
        const pc = createPC(socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice:offer', { targetSocketId: socketId, offer });
      }
    };

    // Another user joined — they will send us an offer (we are existing)
    const onUserJoined = ({ socketId, userId, username }: { socketId: string; userId?: string; username?: string }) => {
      createPC(socketId, userId, username);
    };

    const onOffer = async ({ fromSocketId, offer }: { fromSocketId: string; offer: RTCSessionDescriptionInit }) => {
      let entry = peersRef.current.get(fromSocketId);
      if (!entry) { createPC(fromSocketId); entry = peersRef.current.get(fromSocketId)!; }
      await entry.pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await entry.pc.createAnswer();
      await entry.pc.setLocalDescription(answer);
      socket.emit('voice:answer', { targetSocketId: fromSocketId, answer });
    };

    const onAnswer = async ({ fromSocketId, answer }: { fromSocketId: string; answer: RTCSessionDescriptionInit }) => {
      const entry = peersRef.current.get(fromSocketId);
      if (entry) await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = async ({ fromSocketId, candidate }: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
      const entry = peersRef.current.get(fromSocketId);
      if (entry && candidate) await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const onUserLeft = ({ socketId }: { socketId: string }) => {
      peersRef.current.get(socketId)?.pc.close();
      peersRef.current.delete(socketId);
      setPeers(prev => prev.filter(p => p.socketId !== socketId));
    };

    const onMuteUpdate = ({ socketId, isMuted }: { socketId: string; isMuted: boolean }) => {
      updatePeer(socketId, { isMuted });
    };

    socket.on('voice:room-peers',   onRoomPeers);
    socket.on('voice:user-joined',  onUserJoined);
    socket.on('voice:offer',        onOffer);
    socket.on('voice:answer',       onAnswer);
    socket.on('voice:ice-candidate',onIceCandidate);
    socket.on('voice:user-left',    onUserLeft);
    socket.on('voice:mute-update',  onMuteUpdate);

    return () => {
      socket.off('voice:room-peers',   onRoomPeers);
      socket.off('voice:user-joined',  onUserJoined);
      socket.off('voice:offer',        onOffer);
      socket.off('voice:answer',       onAnswer);
      socket.off('voice:ice-candidate',onIceCandidate);
      socket.off('voice:user-left',    onUserLeft);
      socket.off('voice:mute-update',  onMuteUpdate);
    };
  }, [socket, roomId, createPC]);

  // ── Public controls ────────────────────────────────────────────────────
  const joinVoice = useCallback(async () => {
    if (!isWebRTCSupported()) { setError('WebRTC is not supported in this browser'); return; }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl:  true,
          // Keep sampleRate flexible so iOS/Android picks the native rate
        },
        video: false,
      });
      localStreamRef.current = stream;
      setIsInVoice(true);
      socket?.emit('voice:join');

      // Speaking detection
      const analyser = createVolumeAnalyser(stream);
      analyserRef.current = analyser;
      analyser.start((speaking) => setIsSpeaking(speaking));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, [socket]);

  const leaveVoice = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current?.stop();
    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();
    setPeers([]);
    setIsInVoice(false);
    setIsSpeaking(false);
    socket?.emit('voice:leave');
  }, [socket]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const newMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
    setIsMuted(newMuted);
    socket?.emit('voice:mute', { isMuted: newMuted });
  }, [isMuted, socket]);

  // Cleanup on unmount
  useEffect(() => () => { if (isInVoice) leaveVoice(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { isInVoice, isMuted, isSpeaking, peers, error, joinVoice, leaveVoice, toggleMute };
}
