import { supabase } from '../supabase';
import type { Drawing } from '../database.types';

export async function createDrawing(userId: string, title = 'Untitled Drawing'): Promise<Drawing> {
  const { data, error } = await supabase
    .from('drawings')
    .insert({ user_id: userId, title })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDrawing(id: string): Promise<Drawing | null> {
  const { data, error } = await supabase
    .from('drawings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function getUserDrawings(userId: string): Promise<Drawing[]> {
  const { data, error } = await supabase
    .from('drawings')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateDrawing(id: string, patch: Partial<Omit<Drawing, 'id' | 'user_id' | 'created_at'>>) {
  const { error } = await supabase
    .from('drawings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteDrawing(id: string) {
  const { error } = await supabase.from('drawings').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateDrawing(id: string, userId: string): Promise<Drawing> {
  const { data: original, error: fetchErr } = await supabase
    .from('drawings')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !original) throw fetchErr ?? new Error('Drawing not found');

  const { data: copy, error: copyErr } = await supabase
    .from('drawings')
    .insert({ user_id: userId, title: `${original.title} (copy)` })
    .select()
    .single();
  if (copyErr || !copy) throw copyErr ?? new Error('Duplication failed');

  // Copy strokes
  const { data: originalStrokes } = await (supabase.from('strokes') as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .select('stroke_data')
    .eq('drawing_id', id);

  if (originalStrokes && originalStrokes.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('strokes') as any).insert(
      originalStrokes.map((s: { stroke_data: unknown }) => ({ drawing_id: copy.id, stroke_data: s.stroke_data })),
    );
  }

  return copy;
}
