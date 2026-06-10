// ── Shared event payload types ────────────────────────────────────────────────
// These are duplicated in the frontend (src/types/room.ts) — keep them in sync.

export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: 'pencil' | 'brush' | 'eraser';
  opacity: number;
  timestamp: number;
  userId: string;     // identifies the author — critical for multiplayer
  sessionId: string;  // room session
}

export interface Participant {
  userId: string;       // Supabase user ID or generated guest ID
  socketId: string;
  username: string;
  color: string;        // unique color within the room
  isOwner: boolean;
  isAnonymous: boolean;
  status: 'active' | 'idle';
  joinedAt: number;
  lastSeen: number;
}

export interface Room {
  id: string;            // PC-XXXXXX
  drawingId: string | null;
  name: string;
  ownerId: string;
  type: 'public' | 'private' | 'invite_only';
  maxUsers: number;
  participantCount: number;
  createdAt: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'syncing';

export interface ActivityEvent {
  id: string;
  type: 'join' | 'leave' | 'draw' | 'erase' | 'clear' | 'undo';
  userId: string;
  username: string;
  timestamp: number;
}

export interface CursorPosition {
  userId: string;
  username: string;
  color: string;
  x: number;   // 0–1 normalized
  y: number;
  isDrawing: boolean;
}

// ── Client → Server ──────────────────────────────────────────────────────────
export interface C2SEvents {
  'room:join':          (payload: { roomId: string; username: string; userId?: string }) => void;
  'room:leave':         () => void;
  'cursor:move':        (payload: { x: number; y: number; isDrawing: boolean }) => void;
  'stroke:start':       (payload: { strokeId: string; color: string; width: number; tool: string; opacity: number }) => void;
  'stroke:points':      (payload: { strokeId: string; points: Point[] }) => void;
  'stroke:end':         (payload: { stroke: Stroke }) => void;
  'stroke:undo':        () => void;
  'canvas:clear':       () => void;
  'room:request-state': () => void;
}

// ── Server → Client ──────────────────────────────────────────────────────────
export interface S2CEvents {
  'room:joined':        (payload: { room: Room; participant: Participant; participants: Participant[]; strokes: Stroke[] }) => void;
  'room:error':         (payload: { message: string }) => void;
  'room:user-joined':   (payload: { participant: Participant }) => void;
  'room:user-left':     (payload: { userId: string; socketId: string }) => void;
  'cursor:positions':   (payload: { cursors: CursorPosition[] }) => void;
  'stroke:start':       (payload: { strokeId: string; userId: string; color: string; width: number; tool: string; opacity: number }) => void;
  'stroke:points':      (payload: { strokeId: string; userId: string; points: Point[] }) => void;
  'stroke:end':         (payload: { stroke: Stroke }) => void;
  'stroke:undo':        (payload: { userId: string; strokeId: string }) => void;
  'canvas:clear':       (payload: { userId: string }) => void;
  'activity:event':     (payload: ActivityEvent) => void;
  'room:state':         (payload: { strokes: Stroke[]; participants: Participant[] }) => void;
}
