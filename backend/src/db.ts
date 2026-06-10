import { createClient } from '@supabase/supabase-js';
import type { Stroke } from './types/events';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = url && key ? createClient(url, key, {
  auth: { persistSession: false },
}) : null;

if (!supabaseAdmin) {
  console.warn('[db] Supabase not configured — rooms will not be persisted across restarts.');
}

export interface RoomRecord {
  id: string;
  name: string;
  drawing_id: string | null;
  owner_id: string;
  type: string;
  max_users: number;
}

export async function ensureRoom(roomId: string, ownerId: string): Promise<RoomRecord> {
  if (!supabaseAdmin) {
    return { id: roomId, name: 'Untitled Room', drawing_id: null, owner_id: ownerId, type: 'public', max_users: 20 };
  }

  const { data } = await supabaseAdmin.from('rooms').select('*').eq('id', roomId).single() as { data: RoomRecord | null };
  if (data) return data;

  // Create a drawing for this room and the room record
  const { data: drawing } = await supabaseAdmin
    .from('drawings')
    .insert({ user_id: ownerId, title: 'Room Canvas' })
    .select()
    .single() as { data: { id: string } | null };

  const record: RoomRecord = {
    id: roomId, name: 'Untitled Room',
    drawing_id: drawing?.id ?? null,
    owner_id: ownerId, type: 'public', max_users: 20,
  };
  await supabaseAdmin.from('rooms').insert(record);
  return record;
}

export async function loadRoomStrokes(drawingId: string): Promise<Stroke[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from('strokes')
    .select('stroke_data')
    .eq('drawing_id', drawingId)
    .order('created_at', { ascending: true }) as { data: { stroke_data: unknown }[] | null };
  return (data ?? []).map(r => r.stroke_data as Stroke);
}

export async function saveRoomStrokes(drawingId: string, strokes: Stroke[]): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('strokes').delete().eq('drawing_id', drawingId);
  const BATCH = 100;
  for (let i = 0; i < strokes.length; i += BATCH) {
    const batch = strokes.slice(i, i + BATCH);
    await supabaseAdmin.from('strokes').insert(
      batch.map(s => ({ drawing_id: drawingId, stroke_data: s as unknown as Record<string, unknown> })),
    );
  }
  await supabaseAdmin.from('drawings').update({ updated_at: new Date().toISOString() }).eq('id', drawingId);
}
