import { useState, useRef, useCallback, useEffect, type RefObject } from 'react';
import type { Stroke } from '@/drawing/types';
import type {
  Room, Participant, ConnectionStatus, ActivityEvent, CursorPosition, OfflineEvent,
} from '@/types/room';
import { createRoomSocket, type AppSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

const MAX_ACTIVITY = 50;

export interface UseMultiplayerRoomReturn {
  room:               Room | null;
  myParticipant:      Participant | null;
  participants:       Participant[];
  cursors:            CursorPosition[];
  activity:           ActivityEvent[];
  connectionStatus:   ConnectionStatus;
  socket:             AppSocket | null;
  emitStrokeStart:    (stroke: Stroke) => void;
  emitStrokePoints:   (strokeId: string, points: Stroke['points']) => void;
  emitStrokeEnd:      (stroke: Stroke) => void;
  emitStrokeUndo:     () => void;
  emitCanvasClear:    () => void;
  emitCursorMove:     (x: number, y: number, isDrawing: boolean) => void;
  leave:              () => void;
}

// Denormalize a stroke's points from 0-1 space to CSS pixel space using
// the current canvas container dimensions. Must be called after the canvas
// has been sized (i.e. not during SSR or before mount).
function denormalize(stroke: Stroke, W: number, H: number): Stroke {
  return { ...stroke, points: stroke.points.map(p => ({ ...p, x: p.x * W, y: p.y * H })) };
}
function denormalizePoints(points: Stroke['points'], W: number, H: number): Stroke['points'] {
  return points.map(p => ({ ...p, x: p.x * W, y: p.y * H }));
}

export interface UseMultiplayerRoomCallbacks {
  onServerStrokes?: (strokes: Stroke[]) => void;
  onRemoteStrokeEnd?: (stroke: Stroke) => void;
}

export function useMultiplayerRoom(
  roomId: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvasRef: RefObject<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remoteRef: RefObject<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerRef?: RefObject<any>,
  callbacks?: UseMultiplayerRoomCallbacks,
): UseMultiplayerRoomReturn {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const { user } = useAuth();
  const socketRef = useRef<AppSocket | null>(null);

  const [room,             setRoom]             = useState<Room | null>(null);
  const [myParticipant,    setMyParticipant]     = useState<Participant | null>(null);
  const [participants,     setParticipants]      = useState<Participant[]>([]);
  const [cursors,          setCursors]           = useState<CursorPosition[]>([]);
  const [activity,         setActivity]          = useState<ActivityEvent[]>([]);
  const [connectionStatus, setConnectionStatus]  = useState<ConnectionStatus>('connecting');

  const offlineQueue = useRef<OfflineEvent[]>([]);
  const isOnline = useRef(false);

  const getSize = useCallback(() => {
    const rect = containerRef?.current?.getBoundingClientRect();
    return { W: rect?.width ?? 1, H: rect?.height ?? 1 };
  }, [containerRef]);

  // ── Emit with offline queue ──────────────────────────────────────────────
  const emit = useCallback(<T>(event: string, payload?: T) => {
    const s = socketRef.current;
    if (s && isOnline.current) {
      s.emit(event, payload);
    } else {
      offlineQueue.current.push({ event, payload, ts: Date.now() });
    }
  }, []);

  const flushQueue = useCallback(() => {
    const s = socketRef.current;
    if (!s) return;
    const q = offlineQueue.current.splice(0);
    q.forEach(({ event, payload }) => s.emit(event, payload));
  }, []);

  const addActivity = useCallback((ev: ActivityEvent) => {
    setActivity(prev => {
      const next = [ev, ...prev];
      return next.length > MAX_ACTIVITY ? next.slice(0, MAX_ACTIVITY) : next;
    });
  }, []);

  // ── Socket setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const token = undefined; // Supabase token — attach in Phase 5 when needed
    const socket = createRoomSocket(token);
    socketRef.current = socket;

    const username = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? undefined;
    const userId   = user?.id;

    // ── Connection events ─────────────────────────────────────────────────
    socket.on('connect', () => {
      setConnectionStatus('syncing');
      isOnline.current = false;

      socket.emit('room:join', { roomId, username: username ?? '', userId });
    });

    socket.on('disconnect', () => {
      setConnectionStatus('reconnecting');
      isOnline.current = false;
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    socket.io.on('reconnect', () => {
      setConnectionStatus('syncing');
      socket.emit('room:join', { roomId, username: username ?? '', userId });
      flushQueue();
    });

    // ── Room events ───────────────────────────────────────────────────────
    socket.on('room:joined', ({ room: r, participant, participants: ps, strokes }) => {
      setRoom(r);
      setMyParticipant(participant);
      setParticipants(ps);
      setConnectionStatus('connected');
      isOnline.current = true;

      const { W, H } = getSize();
      const denormalized = (strokes as unknown as Stroke[]).map(s => denormalize(s, W, H));
      if (callbacksRef.current?.onServerStrokes) {
        callbacksRef.current.onServerStrokes(denormalized);
      } else {
        canvasRef.current?.redrawAll(denormalized);
      }
      flushQueue();
    });

    socket.on('room:error', ({ message }) => {
      console.error('[room:error]', message);
      setConnectionStatus('disconnected');
    });

    socket.on('room:user-joined', ({ participant }) => {
      setParticipants(prev => [...prev.filter(p => p.userId !== participant.userId), participant]);
    });

    socket.on('room:user-left', ({ socketId }) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
      // Remove their cursor
      setCursors(prev => {
        const gone = participants.find(p => p.socketId === socketId);
        if (!gone) return prev;
        return prev.filter((c: { userId: string }) => c.userId !== gone.userId);
      });
    });

    socket.on('room:state', ({ strokes, participants: ps }) => {
      const { W, H } = getSize();
      const denormalized = (strokes as unknown as Stroke[]).map(s => denormalize(s, W, H));
      if (callbacksRef.current?.onServerStrokes) {
        callbacksRef.current.onServerStrokes(denormalized);
      } else {
        canvasRef.current?.redrawAll(denormalized);
      }
      setParticipants(ps);
    });

    // ── Cursor events ─────────────────────────────────────────────────────
    socket.on('cursor:positions', ({ cursors: newCursors }) => {
      // Filter out local user's cursor
      const filtered = newCursors.filter((c: { userId: string }) => c.userId !== userId);
      setCursors(filtered);
    });

    // ── Stroke events ─────────────────────────────────────────────────────
    socket.on('stroke:start', ({ strokeId, userId: sUserId, color, width, tool, opacity }) => {
      if (sUserId === userId) return;
      remoteRef.current?.startStroke(sUserId, {
        id: strokeId, points: [], color, width,
        tool: tool as 'pencil' | 'brush' | 'eraser',
        opacity, timestamp: Date.now(),
        userId: sUserId, sessionId: roomId ?? '',
      });
    });

    socket.on('stroke:points', ({ strokeId, userId: sUserId, points }) => {
      if (sUserId === userId) return;
      const { W, H } = getSize();
      remoteRef.current?.addPoints(sUserId, strokeId, denormalizePoints(points as Stroke['points'], W, H));
    });

    socket.on('stroke:end', ({ stroke }) => {
      if (stroke.userId === userId) return;
      remoteRef.current?.commitStroke(stroke.userId);
      const { W, H } = getSize();
      const denormalized = denormalize(stroke as unknown as Stroke, W, H);
      if (callbacksRef.current?.onRemoteStrokeEnd) {
        callbacksRef.current.onRemoteStrokeEnd(denormalized);
      } else {
        canvasRef.current?.appendStroke(denormalized);
      }
    });

    socket.on('stroke:undo', ({ userId: sUserId, strokeId }) => {
      if (sUserId === userId) return;
      // Full redraw — request updated state
      socket.emit('room:request-state');
      void strokeId; // used for future optimized undo
    });

    socket.on('canvas:clear', ({ userId: sUserId }) => {
      if (sUserId === userId) return;
      canvasRef.current?.clearDrawing();
      remoteRef.current?.clearAll();
    });

    // ── Activity feed ─────────────────────────────────────────────────────
    socket.on('activity:event', addActivity);

    socket.connect();

    return () => {
      isOnline.current = false;
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);

  // ── Emit helpers ─────────────────────────────────────────────────────────
  const emitStrokeStart = useCallback((stroke: Stroke) => {
    emit('stroke:start', {
      strokeId: stroke.id, color: stroke.color,
      width: stroke.width, tool: stroke.tool, opacity: stroke.opacity,
    });
  }, [emit]);

  const emitStrokePoints = useCallback((strokeId: string, points: Stroke['points']) => {
    emit('stroke:points', { strokeId, points });
  }, [emit]);

  const emitStrokeEnd = useCallback((stroke: Stroke) => {
    emit('stroke:end', { stroke });
  }, [emit]);

  const emitStrokeUndo = useCallback(() => {
    emit('stroke:undo');
  }, [emit]);

  const emitCanvasClear = useCallback(() => {
    emit('canvas:clear');
  }, [emit]);

  // Throttled cursor emit
  const lastCursorEmit = useRef(0);
  const emitCursorMove = useCallback((x: number, y: number, isDrawing: boolean) => {
    const now = Date.now();
    if (now - lastCursorEmit.current < 50) return; // 20fps max
    lastCursorEmit.current = now;
    emit('cursor:move', { x, y, isDrawing });
  }, [emit]);

  const leave = useCallback(() => {
    socketRef.current?.emit('room:leave');
    socketRef.current?.disconnect();
  }, []);

  return {
    room, myParticipant, participants, cursors, activity, connectionStatus,
    socket: socketRef.current,
    emitStrokeStart, emitStrokePoints, emitStrokeEnd, emitStrokeUndo,
    emitCanvasClear, emitCursorMove, leave,
  };
}
