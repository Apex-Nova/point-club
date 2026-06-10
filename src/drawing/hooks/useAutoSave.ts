import { useEffect, useRef } from 'react';
import type { Stroke } from '../types';
import { saveDrawing } from '../utils/storage';

const INTERVAL_MS = 30_000;

export function useAutoSave(strokes: Stroke[], onSave?: () => void) {
  const strokesRef = useRef(strokes);
  const onSaveRef = useRef(onSave);
  strokesRef.current = strokes;
  onSaveRef.current = onSave;

  useEffect(() => {
    const id = setInterval(() => {
      if (strokesRef.current.length > 0) {
        try {
          saveDrawing(strokesRef.current);
          onSaveRef.current?.();
        } catch {
          // Storage might be full — fail silently; manual save shows error toast
        }
      }
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
