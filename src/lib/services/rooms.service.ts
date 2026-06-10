const API = import.meta.env.VITE_SOCKET_URL as string ?? 'http://localhost:3001';

export interface CreateRoomOptions {
  name?: string;
  userId?: string;
  type?: 'public' | 'private' | 'invite_only';
}

export interface RoomInfo {
  roomId: string;
  drawingId: string | null;
  name: string;
  onlineCount?: number;
}

export async function createRoom(opts: CreateRoomOptions = {}): Promise<RoomInfo> {
  const res = await fetch(`${API}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json() as Promise<RoomInfo>;
}

export async function getRoomInfo(roomId: string): Promise<RoomInfo & { type: string }> {
  const res = await fetch(`${API}/api/rooms/${roomId}`);
  if (!res.ok) throw new Error('Room not found');
  return res.json();
}
