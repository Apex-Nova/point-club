import type { Server, Socket } from 'socket.io';
import { supabaseAdmin } from '../db';

// In-memory element store: roomId → Map<elementId, element>
const roomElements = new Map<string, Map<string, Record<string, unknown>>>();

export function registerWhiteboardHandlers(io: Server, socket: Socket) {
  const uid  = () => socket.data.userId   as string | undefined;
  const room = () => socket.data.currentRoomId as string | undefined;

  // ── Load room elements ───────────────────────────────────────
  socket.on('wb:load', async () => {
    const roomId = room();
    if (!roomId) return;

    if (roomElements.has(roomId)) {
      socket.emit('wb:elements', { elements: Array.from(roomElements.get(roomId)!.values()) });
      return;
    }

    if (!supabaseAdmin) { socket.emit('wb:elements', { elements: [] }); return; }
    const { data } = await supabaseAdmin.from('whiteboard_elements')
      .select('*').eq('room_id', roomId).order('z_index', { ascending: true });

    const map = new Map<string, Record<string, unknown>>();
    (data ?? []).forEach((el: Record<string, unknown>) => map.set(el.id as string, el));
    roomElements.set(roomId, map);
    socket.emit('wb:elements', { elements: data ?? [] });
  });

  // ── Add element ──────────────────────────────────────────────
  socket.on('wb:add', async (element: Record<string, unknown>) => {
    const roomId = room();
    const userId = uid();
    if (!roomId || !userId) return;

    const el = {
      ...element,
      id:         element.id ?? crypto.randomUUID(),
      room_id:    roomId,
      created_by: userId,
      updated_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!roomElements.has(roomId)) roomElements.set(roomId, new Map());
    roomElements.get(roomId)!.set(el.id as string, el);

    io.to(roomId).emit('wb:added', { element: el });

    void supabaseAdmin?.from('whiteboard_elements').upsert(el);
  });

  // ── Update element (move, resize, edit) ──────────────────────
  socket.on('wb:update', (patch: { id: string } & Record<string, unknown>) => {
    const roomId = room();
    const userId = uid();
    if (!roomId || !userId || !patch.id) return;

    const map = roomElements.get(roomId);
    const existing = map?.get(patch.id as string);
    if (!existing) return;

    const updated = { ...existing, ...patch, updated_by: userId, updated_at: new Date().toISOString() };
    map!.set(patch.id as string, updated);
    socket.to(roomId).emit('wb:updated', { element: updated });

    void supabaseAdmin?.from('whiteboard_elements').update(patch).eq('id', patch.id);
  });

  // ── Delete element ───────────────────────────────────────────
  socket.on('wb:delete', ({ id }: { id: string }) => {
    const roomId = room();
    if (!roomId) return;
    roomElements.get(roomId)?.delete(id);
    io.to(roomId).emit('wb:deleted', { id });
    void supabaseAdmin?.from('whiteboard_elements').delete().eq('id', id);
  });

  // ── Lock/unlock for collaborative editing ────────────────────
  socket.on('wb:lock', ({ id }: { id: string }) => {
    const roomId = room();
    const userId = uid();
    if (!roomId || !userId) return;
    const el = roomElements.get(roomId)?.get(id);
    if (el && !el.locked_by) {
      el.locked_by = userId;
      socket.to(roomId).emit('wb:locked', { id, userId });
    }
  });

  socket.on('wb:unlock', ({ id }: { id: string }) => {
    const roomId = room();
    if (!roomId) return;
    const el = roomElements.get(roomId)?.get(id);
    if (el) {
      el.locked_by = null;
      socket.to(roomId).emit('wb:unlocked', { id });
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    const roomId = room();
    const userId = uid();
    if (!roomId || !userId) return;
    // Unlock all elements locked by this user
    const map = roomElements.get(roomId);
    if (map) {
      map.forEach(el => {
        if (el.locked_by === userId) {
          el.locked_by = null;
          socket.to(roomId).emit('wb:unlocked', { id: el.id });
        }
      });
    }
  });
}
