import type { Server, Socket } from 'socket.io';

// Active presentations: roomId → { presenterId, currentSlide, viewerCount }
const activePresentations = new Map<string, {
  presenterId: string;
  presenterSocketId: string;
  currentSlide: number;
  laserPos: { x: number; y: number } | null;
  followMode: boolean;
  viewerCount: number;
}>();

export function registerPresentationHandlers(io: Server, socket: Socket) {
  const uid  = () => socket.data.userId   as string | undefined;
  const uname = () => socket.data.username as string | undefined;
  const room = () => socket.data.currentRoomId as string | undefined;

  // ── Start presentation ────────────────────────────────────────
  socket.on('present:start', ({ title }: { title?: string }) => {
    const roomId = room();
    const userId = uid();
    if (!roomId || !userId) return;

    activePresentations.set(roomId, {
      presenterId: userId, presenterSocketId: socket.id,
      currentSlide: 0, laserPos: null, followMode: true, viewerCount: 0,
    });

    io.to(roomId).emit('present:started', {
      presenterId: userId, presenterName: uname(), title,
    });
  });

  // ── Stop presentation ─────────────────────────────────────────
  socket.on('present:stop', () => {
    const roomId = room();
    if (!roomId) return;
    activePresentations.delete(roomId);
    io.to(roomId).emit('present:stopped');
  });

  // ── Slide navigation ──────────────────────────────────────────
  socket.on('present:slide', ({ slide }: { slide: number }) => {
    const roomId = room();
    const pres   = roomId ? activePresentations.get(roomId) : null;
    if (!pres || pres.presenterSocketId !== socket.id) return;
    pres.currentSlide = slide;
    socket.to(roomId!).emit('present:slide', { slide });
  });

  // ── Laser pointer ─────────────────────────────────────────────
  socket.on('present:laser', ({ x, y }: { x: number; y: number }) => {
    const roomId = room();
    const pres   = roomId ? activePresentations.get(roomId) : null;
    if (!pres || pres.presenterSocketId !== socket.id) return;
    pres.laserPos = { x, y };
    socket.to(roomId!).emit('present:laser', { x, y });
  });

  socket.on('present:laser-off', () => {
    const roomId = room();
    const pres   = roomId ? activePresentations.get(roomId) : null;
    if (!pres || pres.presenterSocketId !== socket.id) return;
    pres.laserPos = null;
    socket.to(roomId!).emit('present:laser-off');
  });

  // ── Audience join / leave ─────────────────────────────────────
  socket.on('present:join-audience', () => {
    const roomId = room();
    const pres   = roomId ? activePresentations.get(roomId) : null;
    if (!pres) return;
    pres.viewerCount++;
    io.to(roomId!).emit('present:viewer-count', { count: pres.viewerCount });
    // Sync new viewer to current state
    socket.emit('present:sync', { slide: pres.currentSlide, laserPos: pres.laserPos });
  });

  socket.on('present:leave-audience', () => {
    const roomId = room();
    const pres   = roomId ? activePresentations.get(roomId) : null;
    if (!pres) return;
    pres.viewerCount = Math.max(0, pres.viewerCount - 1);
    io.to(roomId!).emit('present:viewer-count', { count: pres.viewerCount });
  });

  // ── Annotation broadcast ──────────────────────────────────────
  socket.on('present:annotate', (data: unknown) => {
    const roomId = room();
    if (!roomId) return;
    socket.to(roomId).emit('present:annotate', data);
  });

  // Cleanup
  socket.on('disconnect', () => {
    const roomId = room();
    const userId = uid();
    if (!roomId || !userId) return;
    const pres = activePresentations.get(roomId);
    if (pres?.presenterId === userId) {
      activePresentations.delete(roomId);
      socket.to(roomId).emit('present:stopped');
    }
  });
}
