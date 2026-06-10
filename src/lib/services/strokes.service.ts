import { supabase } from '../supabase';
import type { Stroke } from '@/drawing/types';

const BATCH = 100;
// Cast to any to work around Supabase's strict internal type inference
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function saveStrokes(drawingId: string, strokes: Stroke[]): Promise<void> {
  const { error: delErr } = await db.from('strokes').delete().eq('drawing_id', drawingId);
  if (delErr) throw delErr;

  if (strokes.length === 0) return;

  for (let i = 0; i < strokes.length; i += BATCH) {
    const batch = strokes.slice(i, i + BATCH);
    const { error } = await db.from('strokes').insert(
      batch.map((s: Stroke) => ({ drawing_id: drawingId, stroke_data: s })),
    );
    if (error) throw error;
  }
}

export async function loadStrokes(drawingId: string): Promise<Stroke[]> {
  const { data, error } = await db
    .from('strokes')
    .select('stroke_data')
    .eq('drawing_id', drawingId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as { stroke_data: unknown }[]).map(row => row.stroke_data as Stroke);
}
