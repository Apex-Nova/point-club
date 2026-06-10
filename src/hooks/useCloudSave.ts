import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Stroke } from '@/drawing/types';
import { saveStrokes } from '@/lib/services/strokes.service';
import { uploadThumbnail } from '@/lib/services/storage.service';
import { updateDrawing } from '@/lib/services/drawings.service';

export type CloudSaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

const AUTO_SAVE_MS = 15_000;

export function useCloudSave(
  drawingId: string | null,
  strokes: Stroke[],
  getThumbnail: () => string,
) {
  const { user } = useAuth();
  const [status, setStatus]       = useState<CloudSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for interval callbacks — no stale closures
  const strokesRef      = useRef(strokes);
  const getThumbnailRef = useRef(getThumbnail);
  const drawingIdRef    = useRef(drawingId);
  const savedRef        = useRef<Stroke[] | null>(null); // strokes array as of last save
  const savingRef       = useRef(false);

  strokesRef.current      = strokes;
  getThumbnailRef.current = getThumbnail;
  drawingIdRef.current    = drawingId;

  // Detect unsaved changes
  useEffect(() => {
    if (savedRef.current !== null && savedRef.current !== strokes) {
      setStatus('unsaved');
    }
  }, [strokes]);

  const save = useCallback(async (): Promise<void> => {
    const dId = drawingIdRef.current;
    if (!dId || !user || savingRef.current) return;

    savingRef.current = true;
    setStatus('saving');

    try {
      const currentStrokes = strokesRef.current;
      await saveStrokes(dId, currentStrokes);

      // Thumbnail — fire-and-forget if it fails
      try {
        const dataUrl = getThumbnailRef.current();
        if (dataUrl && dataUrl !== 'data:,') {
          const thumbUrl = await uploadThumbnail(dId, dataUrl);
          await updateDrawing(dId, {
            thumbnail:    thumbUrl,
            stroke_count: currentStrokes.length,
          });
        } else {
          await updateDrawing(dId, { stroke_count: currentStrokes.length });
        }
      } catch {
        // Thumbnail failure doesn't block the save
      }

      savedRef.current = currentStrokes;
      setLastSaved(new Date());
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      savingRef.current = false;
    }
  }, [user]);

  // Auto-save interval
  useEffect(() => {
    if (!drawingId || !user) return;

    const id = setInterval(() => {
      if (strokesRef.current !== savedRef.current && !savingRef.current) {
        save();
      }
    }, AUTO_SAVE_MS);

    return () => clearInterval(id);
  }, [drawingId, user, save]);

  // Called once after cloud strokes are loaded so the first interval doesn't fire unnecessarily
  const markClean = useCallback((loadedStrokes: Stroke[]) => {
    savedRef.current = loadedStrokes;
    setStatus('saved');
    setLastSaved(new Date());
  }, []);

  return { status, lastSaved, save, markClean };
}
