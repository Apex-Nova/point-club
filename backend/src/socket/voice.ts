import type { Server, Socket } from 'socket.io';

// Pure signaling relay — WebRTC negotiation data is forwarded unchanged
export function registerVoiceHandlers(io: Server, socket: Socket) {
  const uid   = () => socket.data.userId   as string | undefined;
  const uname = () => socket.data.username as string | undefined;
  const room  = () => socket.data.currentRoomId as string | undefined;

  // Room-level tracking: roomId → Set<socketId>
  const voiceRooms: Map<string, Set<string>> = (io as unknown as { _voiceRooms?: Map<string, Set<string>> })._voiceRooms ?? new Map();
  (io as unknown as { _voiceRooms: Map<string, Set<string>> })._voiceRooms = voiceRooms;

  socket.on('voice:join', () => {
    const roomId = room();
    if (!roomId) return;

    if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Set());
    const existing = Array.from(voiceRooms.get(roomId)!);
    voiceRooms.get(roomId)!.add(socket.id);

    // Tell the joining user who's already in voice (they will initiate offers)
    socket.emit('voice:room-peers', { peers: existing.map(sid => ({ socketId: sid })) });

    // Tell existing peers someone new joined
    socket.to(roomId).emit('voice:user-joined', {
      socketId: socket.id,
      userId:   uid(),
      username: uname(),
    });
  });

  socket.on('voice:leave', () => {
    const roomId = room();
    if (!roomId) return;
    voiceRooms.get(roomId)?.delete(socket.id);
    socket.to(roomId).emit('voice:user-left', { socketId: socket.id });
  });

  // Pure relay events — no server-side processing needed
  socket.on('voice:offer', ({ targetSocketId, offer }: { targetSocketId: string; offer: unknown }) => {
    io.to(targetSocketId).emit('voice:offer', { fromSocketId: socket.id, offer });
  });

  socket.on('voice:answer', ({ targetSocketId, answer }: { targetSocketId: string; answer: unknown }) => {
    io.to(targetSocketId).emit('voice:answer', { fromSocketId: socket.id, answer });
  });

  socket.on('voice:ice-candidate', ({ targetSocketId, candidate }: { targetSocketId: string; candidate: unknown }) => {
    io.to(targetSocketId).emit('voice:ice-candidate', { fromSocketId: socket.id, candidate });
  });

  socket.on('voice:mute', ({ isMuted }: { isMuted: boolean }) => {
    const roomId = room();
    if (!roomId) return;
    socket.to(roomId).emit('voice:mute-update', { socketId: socket.id, userId: uid(), isMuted });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    const roomId = room();
    if (roomId) {
      voiceRooms.get(roomId)?.delete(socket.id);
      socket.to(roomId).emit('voice:user-left', { socketId: socket.id });
    }
  });
}
