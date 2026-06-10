import {
  forwardRef, useRef, useImperativeHandle,
  useEffect, useCallback,
} from 'react';
import type { Stroke } from '@/drawing/types';
import { renderStroke, initContext } from '@/drawing/utils/renderer';

export interface RemoteStrokesHandle {
  startStroke:  (userId: string, stroke: Stroke) => void;
  addPoints:    (userId: string, strokeId: string, points: Stroke['points']) => void;
  commitStroke: (userId: string) => void;
  clearAll:     () => void;
}

// Map userId → active in-progress stroke
type ActiveMap = Map<string, Stroke>;

const RemoteStrokesLayer = forwardRef<RemoteStrokesHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef    = useRef<CanvasRenderingContext2D | null>(null);
  const activeRef = useRef<ActiveMap>(new Map());

  const redraw = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    for (const stroke of activeRef.current.values()) {
      renderStroke(ctx, stroke);
    }
  }, []);

  const setupCtx = useCallback(() => {
    if (!canvasRef.current) return;
    ctxRef.current = initContext(canvasRef.current);
    redraw();
  }, [redraw]);

  useEffect(() => {
    setupCtx();
    const ro = new ResizeObserver(setupCtx);
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, [setupCtx]);

  useImperativeHandle(ref, () => ({
    startStroke(userId, stroke) {
      activeRef.current.set(userId, { ...stroke, points: [] });
      redraw();
    },
    addPoints(userId, strokeId, points) {
      const s = activeRef.current.get(userId);
      if (s && s.id === strokeId) {
        s.points.push(...points);
        redraw();
      }
    },
    commitStroke(userId) {
      activeRef.current.delete(userId);
      redraw();
    },
    clearAll() {
      activeRef.current.clear();
      redraw();
    },
  }), [redraw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 15 }}
    />
  );
});

RemoteStrokesLayer.displayName = 'RemoteStrokesLayer';
export default RemoteStrokesLayer;
