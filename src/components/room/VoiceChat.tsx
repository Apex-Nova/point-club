import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Phone, Volume2, AlertCircle } from 'lucide-react';
import type { VoicePeer } from '@/hooks/useVoiceChat';

// Hidden audio element per remote peer — useEffect sets srcObject after mount
// so iOS Safari (which needs the element in the DOM first) works correctly.
function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
      void el.play().catch(() => {/* autoplay policy — user interaction already happened */});
    }
    return () => { el.srcObject = null; };
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline className="hidden" />;
}

function PeerRow({ peer }: { peer: VoicePeer }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-cream transition-colors">
      <div className="relative shrink-0">
        <div className="w-6 h-6 rounded-full bg-lavender-light flex items-center justify-center text-xs font-bold text-lavender-dark">
          {(peer.username ?? '?')[0].toUpperCase()}
        </div>
        {peer.isSpeaking && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute -inset-1 rounded-full border-2 border-mint"
          />
        )}
      </div>
      <span className="text-xs font-medium text-gray-600 truncate flex-1">{peer.username ?? 'User'}</span>
      {peer.isMuted
        ? <MicOff size={11} className="text-coral shrink-0" />
        : <Volume2 size={11} className={peer.isSpeaking ? 'text-mint shrink-0' : 'text-gray-300 shrink-0'} />
      }
      {peer.stream && <RemoteAudio stream={peer.stream} />}
    </div>
  );
}

// ── Props come from useVoiceChat (lifted to RoomPage) ─────────────────────────
export interface VoiceChatProps {
  isInVoice:    boolean;
  isMuted:      boolean;
  isSpeaking:   boolean;
  peers:        VoicePeer[];
  error:        string | null;
  onJoin:       () => void;
  onLeave:      () => void;
  onToggleMute: () => void;
}

export default function VoiceChat({
  isInVoice, isMuted, isSpeaking, peers, error, onJoin, onLeave, onToggleMute,
}: VoiceChatProps) {
  return (
    <div className="border-t border-cream-dark">
      <div className="px-3 py-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Voice</h3>
        {isInVoice && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {error && (
        <div className="mx-2 mb-2 flex items-center gap-1.5 text-[10px] text-coral-dark bg-coral/10 rounded-xl px-2 py-1.5">
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      {isInVoice ? (
        <div className="px-2 pb-2">
          {/* Self row */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-lavender-light/50 mb-1">
            <div className="relative shrink-0">
              <div className="w-6 h-6 rounded-full bg-lavender flex items-center justify-center text-xs font-bold text-white">
                You
              </div>
              {isSpeaking && (
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -inset-1 rounded-full border-2 border-mint" />
              )}
            </div>
            <span className="text-xs font-medium text-lavender-dark flex-1">You {isSpeaking ? '(speaking)' : ''}</span>
            {isMuted && <MicOff size={11} className="text-coral" />}
          </div>

          {peers.map(peer => <PeerRow key={peer.socketId} peer={peer} />)}
          {peers.length === 0 && (
            <p className="text-[10px] text-gray-400 text-center py-2">No one else in voice</p>
          )}

          <div className="flex gap-1.5 mt-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={onToggleMute}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                isMuted ? 'bg-coral/20 text-coral-dark hover:bg-coral/30' : 'bg-cream hover:bg-cream-dark text-gray-600'
              }`}>
              {isMuted ? <MicOff size={12} /> : <Mic size={12} />}
              {isMuted ? 'Unmute' : 'Mute'}
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onLeave}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 bg-coral/20 text-coral-dark hover:bg-coral/30 transition-colors">
              <PhoneOff size={12} />
              Leave
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="px-2 pb-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onJoin}
            className="w-full py-2 rounded-xl bg-mint/20 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-mint/30 transition-colors">
            <Phone size={13} />
            Join Voice
          </motion.button>
        </div>
      )}
    </div>
  );
}
