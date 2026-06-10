import type { Server, Socket } from 'socket.io';
import type { C2SEvents, S2CEvents, Point } from '../types/events';
import roomManager from '../rooms/RoomManager';
import { generateGuestName, generateActivityId, assignColor } from '../rooms/roomUtils';
import { supabaseAdmin, loadRoomStrokes, saveRoomStrokes, ensureRoom } from '../db';
import { registerChatHandlers } from './chat';
import { registerVoiceHandlers } from './voice';
import { registerSocialHandlers } from './social';
import { registerGameHandlers } from './games';
import { registerWorldHandlers } from './world';
import { registerWhiteboardHandlers } from './whiteboard';
import { registerPresentationHandlers } from './presentation';

type IO     = Server<C2SEvents, S2CEvents>;
type TSocket = Socket<C2SEvents, S2CEvents>;

// Cursor batch: accumulate positions and broadcast every 50ms
const cursorBatch = new Map<string, Map<string, { x: number; y: number; isDrawing: boolean; username: string; color: string }>>();
const CURSOR_BROADCAST_MS = 50;

function startCursorBroadcast(io: IO) {
  setInterval(() => {
    for (const [roomId, cursors] of cursorBatch) {
      if (cursors.size === 0) continue;
      const positions = Array.from(cursors.entries()).map(([userId, pos]) => ({
        userId,
        username: pos.username,
        color:    pos.color,
        x:        pos.x,
        y:        pos.y,
        isDrawing: pos.isDrawing,
      }));
      io.to(roomId).emit('cursor:positions', { cursors: positions });
    }
  }, CURSOR_BROADCAST_MS);
}

// Rate limiting: simple per-socket event counters
const eventCounters = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 200; // events per second

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const entry = eventCounters.get(socketId) ?? { count: 0, resetAt: now + 1000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 1000; }
  entry.count++;
  eventCounters.set(socketId, entry);
  return entry.count > RATE_LIMIT;
}

export function registerSocketHandlers(io: IO): void {
  startCursorBroadcast(io);

  io.on('connection', (socket: TSocket) => {
    registerChatHandlers(io, socket as unknown as Socket);
    registerVoiceHandlers(io, socket as unknown as Socket);
    registerSocialHandlers(io, socket as unknown as Socket);
    registerGameHandlers(io, socket as unknown as Socket);
    registerWorldHandlers(io, socket as unknown as Socket);
    registerWhiteboardHandlers(io, socket as unknown as Socket);
    registerPresentationHandlers(io, socket as unknown as Socket);

    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    // ── room:join ────────────────────────────────────────────────────────
    socket.on('room:join', async ({ roomId, username, userId }) => {
      try {
        const resolvedUserId = userId ?? `guest_${socket.id.slice(0, 8)}`;
        const resolvedUsername = username || generateGuestName();
        currentRoomId = roomId;
        currentUserId = resolvedUserId;
        socket.data.currentRoomId = roomId;
        socket.data.userId        = resolvedUserId;
        socket.data.username      = resolvedUsername;

        // Ensure room exists in memory
        const roomMeta = await ensureRoom(roomId, resolvedUserId);
        const room = roomManager.getOrCreateRoom(
          roomId, roomMeta.name, resolvedUserId, roomMeta.drawing_id,
        );

        // Load strokes from Supabase if room is freshly created in memory
        if (room.meta.participantCount === 0 && roomMeta.drawing_id) {
          const persisted = await loadRoomStrokes(roomMeta.drawing_id);
          roomManager.loadStrokes(roomId, persisted);
        }

        const color = roomManager.assignUniqueColor(roomId, resolvedUserId);
        const isOwner = room.meta.ownerId === resolvedUserId;
        const participant = {
          userId: resolvedUserId,
          socketId: socket.id,
          username: resolvedUsername,
          color,
          isOwner,
          isAnonymous: !userId,
          status: 'active' as const,
          joinedAt: Date.now(),
          lastSeen: Date.now(),
        };

        const added = roomManager.addParticipant(roomId, participant);
        if (!added) {
          socket.emit('room:error', { message: 'Room is full' });
          return;
        }

        await socket.join(roomId);

        // Tell the joining user the current state
        socket.emit('room:joined', {
          room: room.meta,
          participant,
          participants: roomManager.getParticipants(roomId),
          strokes: roomManager.getStrokes(roomId),
        });

        // Tell everyone else
        socket.to(roomId).emit('room:user-joined', { participant });

        // Activity feed
        const event = {
          id: generateActivityId(), type: 'join' as const,
          userId: resolvedUserId, username: resolvedUsername, timestamp: Date.now(),
        };
        io.to(roomId).emit('activity:event', event);

        // Init cursor batch slot
        if (!cursorBatch.has(roomId)) cursorBatch.set(roomId, new Map());
        // Pre-seed so username is available before first cursor:move
        cursorBatch.get(roomId)!.set(resolvedUserId, {
          x: 0, y: 0, isDrawing: false,
          username: resolvedUsername,
          color,
        });

      } catch (err) {
        socket.emit('room:error', { message: 'Failed to join room' });
        console.error('[room:join]', err);
      }
    });

    // ── cursor:move ──────────────────────────────────────────────────────
    socket.on('cursor:move', ({ x, y, isDrawing }) => {
      if (!currentRoomId || !currentUserId || isRateLimited(socket.id)) return;
      const roomCursors = cursorBatch.get(currentRoomId);
      if (roomCursors) {
        const participants = roomManager.getParticipants(currentRoomId);
        const p = participants.find(p => p.userId === currentUserId);
        roomCursors.set(currentUserId, {
          x, y, isDrawing,
          username: p?.username ?? (socket.data.username as string) ?? 'Guest',
          color:    p?.color    ?? '#8b78e0',
        });
      }
    });

    // ── stroke:start ─────────────────────────────────────────────────────
    socket.on('stroke:start', ({ strokeId, color, width, tool, opacity }) => {
      if (!currentRoomId || !currentUserId || isRateLimited(socket.id)) return;
      const stroke = {
        id: strokeId, points: [], color, width,
        tool: tool as 'pencil' | 'brush' | 'eraser',
        opacity, timestamp: Date.now(),
        userId: currentUserId, sessionId: currentRoomId,
      };
      roomManager.startActiveStroke(currentRoomId, stroke);
      socket.to(currentRoomId).emit('stroke:start', {
        strokeId, userId: currentUserId, color, width, tool, opacity,
      });
    });

    // ── stroke:points ────────────────────────────────────────────────────
    socket.on('stroke:points', ({ strokeId, points }) => {
      if (!currentRoomId || !currentUserId || isRateLimited(socket.id)) return;
      if (!Array.isArray(points) || points.length === 0) return;
      roomManager.updateActiveStroke(currentRoomId, currentUserId, strokeId, points as Point[]);
      socket.to(currentRoomId).emit('stroke:points', { strokeId, userId: currentUserId, points });
    });

    // ── stroke:end ───────────────────────────────────────────────────────
    socket.on('stroke:end', ({ stroke }) => {
      if (!currentRoomId || !currentUserId || isRateLimited(socket.id)) return;
      stroke.userId = currentUserId;
      stroke.sessionId = currentRoomId;
      roomManager.addStroke(currentRoomId, stroke);
      socket.to(currentRoomId).emit('stroke:end', { stroke });
    });

    // ── stroke:undo ──────────────────────────────────────────────────────
    socket.on('stroke:undo', () => {
      if (!currentRoomId || !currentUserId) return;
      const removedId = roomManager.undoLastStroke(currentRoomId, currentUserId);
      if (removedId) {
        socket.to(currentRoomId).emit('stroke:undo', { userId: currentUserId, strokeId: removedId });
      }
    });

    // ── canvas:clear ─────────────────────────────────────────────────────
    socket.on('canvas:clear', () => {
      if (!currentRoomId || !currentUserId) return;
      roomManager.clearStrokes(currentRoomId);
      io.to(currentRoomId).emit('canvas:clear', { userId: currentUserId });
    });

    // ── room:request-state ───────────────────────────────────────────────
    socket.on('room:request-state', () => {
      if (!currentRoomId) return;
      socket.emit('room:state', {
        strokes: roomManager.getStrokes(currentRoomId),
        participants: roomManager.getParticipants(currentRoomId),
      });
    });

    // ── disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      if (!currentRoomId) return;

      const left = roomManager.removeParticipant(currentRoomId, socket.id);
      if (left) {
        io.to(currentRoomId).emit('room:user-left', { userId: left.userId, socketId: socket.id });
        const event = {
          id: generateActivityId(), type: 'leave' as const,
          userId: left.userId, username: left.username, timestamp: Date.now(),
        };
        io.to(currentRoomId).emit('activity:event', event);
      }

      // If room is now empty, persist strokes to Supabase
      const remaining = roomManager.getParticipants(currentRoomId);
      if (remaining.length === 0) {
        const strokes = roomManager.getStrokes(currentRoomId);
        const room = await supabaseAdmin?.from('rooms').select('drawing_id').eq('id', currentRoomId).single();
        const drawingId = room?.data?.drawing_id as string | undefined;
        if (drawingId && strokes.length > 0) {
          await saveRoomStrokes(drawingId, strokes).catch(console.error);
        }
        cursorBatch.delete(currentRoomId);
      }

      eventCounters.delete(socket.id);
    });
  });
}
