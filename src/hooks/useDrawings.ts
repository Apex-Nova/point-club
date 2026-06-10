import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Drawing } from '@/lib/database.types';
import {
  getUserDrawings,
  createDrawing,
  updateDrawing,
  deleteDrawing,
  duplicateDrawing,
} from '@/lib/services/drawings.service';
import { deleteThumbnail } from '@/lib/services/storage.service';

export function useDrawings() {
  const { user } = useAuth();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      setDrawings(await getUserDrawings(user.id));
    } catch {
      setError('Failed to load drawings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (title?: string): Promise<Drawing> => {
    if (!user) throw new Error('Not authenticated');
    const drawing = await createDrawing(user.id, title);
    setDrawings(prev => [drawing, ...prev]);
    return drawing;
  }, [user]);

  const rename = useCallback(async (id: string, title: string) => {
    await updateDrawing(id, { title });
    setDrawings(prev => prev.map(d => d.id === id ? { ...d, title } : d));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteDrawing(id);
    await deleteThumbnail(id).catch(() => {}); // best-effort
    setDrawings(prev => prev.filter(d => d.id !== id));
  }, []);

  const duplicate = useCallback(async (id: string): Promise<Drawing> => {
    if (!user) throw new Error('Not authenticated');
    const copy = await duplicateDrawing(id, user.id);
    setDrawings(prev => [copy, ...prev]);
    return copy;
  }, [user]);

  return { drawings, loading, error, create, rename, remove, duplicate, refresh: fetch };
}
