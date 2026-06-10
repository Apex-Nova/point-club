import type { Room, Participant, Stroke } from '../types/events';
import { assignColor } from './roomUtils';

interface RoomState {
  meta:           Room;
  participants:   Map<string, Participant>; // socketId → Participant
  strokes:        Stroke[];
  activeStrokes:  Map<string, Stroke>;      // userId → in-progress stroke
}

class RoomManager {
  private rooms = new Map<string, RoomState>();

  createRoom(id: string, name: string, ownerId: string, drawingId: string | null = null): RoomState {
    const state: RoomState = {
      meta: {
        id, name, drawingId, ownerId,
        type: 'public', maxUsers: 20,
        participantCount: 0, createdAt: Date.now(),
      },
      participants:  new Map(),
      strokes:       [],
      activeStrokes: new Map(),
    };
    this.rooms.set(id, state);
    return state;
  }

  getRoom(id: string): RoomState | undefined {
    return this.rooms.get(id);
  }

  getOrCreateRoom(id: string, name = 'Untitled Room', ownerId = 'system', drawingId: string | null = null): RoomState {
    return this.rooms.get(id) ?? this.createRoom(id, name, ownerId, drawingId);
  }

  addParticipant(roomId: string, participant: Participant): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.participants.size >= room.meta.maxUsers) return false;
    room.participants.set(participant.socketId, participant);
    room.meta.participantCount = room.participants.size;
    return true;
  }

  removeParticipant(roomId: string, socketId: string): Participant | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    const p = room.participants.get(socketId);
    room.participants.delete(socketId);
    // Also clean up any active stroke from this user
    if (p) room.activeStrokes.delete(p.userId);
    room.meta.participantCount = room.participants.size;
    // Delete empty rooms to free memory
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
    }
    return p;
  }

  getParticipants(roomId: string): Participant[] {
    return Array.from(this.rooms.get(roomId)?.participants.values() ?? []);
  }

  getUsedColors(roomId: string): Set<string> {
    const room = this.rooms.get(roomId);
    if (!room) return new Set();
    return new Set(Array.from(room.participants.values()).map(p => p.color));
  }

  assignUniqueColor(roomId: string, userId: string): string {
    return assignColor(userId, this.getUsedColors(roomId));
  }

  addStroke(roomId: string, stroke: Stroke): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.strokes.push(stroke);
    room.activeStrokes.delete(stroke.userId);
  }

  updateActiveStroke(roomId: string, userId: string, strokeId: string, points: Stroke['points']): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const existing = room.activeStrokes.get(userId);
    if (existing && existing.id === strokeId) {
      existing.points.push(...points);
    }
  }

  startActiveStroke(roomId: string, stroke: Stroke): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.activeStrokes.set(stroke.userId, { ...stroke, points: [] });
  }

  undoLastStroke(roomId: string, userId: string): string | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    // Find the last stroke by this user and remove it
    for (let i = room.strokes.length - 1; i >= 0; i--) {
      if (room.strokes[i].userId === userId) {
        const [removed] = room.strokes.splice(i, 1);
        return removed.id;
      }
    }
    return null;
  }

  clearStrokes(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.strokes = [];
    room.activeStrokes.clear();
  }

  getStrokes(roomId: string): Stroke[] {
    return this.rooms.get(roomId)?.strokes ?? [];
  }

  loadStrokes(roomId: string, strokes: Stroke[]): void {
    const room = this.rooms.get(roomId);
    if (room) room.strokes = strokes;
  }
}

export default new RoomManager(); // singleton
