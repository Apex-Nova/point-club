// Mirror of backend/src/types/events.ts — keep in sync

import type { Stroke } from '@/drawing/types';

export type { Stroke };

export interface Participant {
  userId: string;
  socketId: string;
  username: string;
  color: string;
  isOwner: boolean;
  isAnonymous: boolean;
  status: 'active' | 'idle';
  joinedAt: number;
  lastSeen: number;
}

export interface Room {
  id: string;
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
  x: number;  // 0–1 normalized
  y: number;
  isDrawing: boolean;
}

export interface OfflineEvent {
  event: string;
  payload: unknown;
  ts: number;
}
