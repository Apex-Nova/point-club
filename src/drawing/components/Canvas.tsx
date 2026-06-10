import {
  forwardRef,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import type { Stroke, Point, ToolSettings, CanvasHandle } from '../types';
import {
  initContext,
  getPointerPoint,
  renderStroke,
  renderAllStrokes,
  exportCanvasImage,
} from '../utils/renderer';
import { generateId } from '../utils/id';

interface CanvasProps {
  toolSettings: ToolSettings;
  strokes: Stroke[];
  zoom?: number; // 1 = 100%, 1.5 = 150%
  onStrokeComplete: (stroke: Stroke) => void;
  onStrokeStart?: (stroke: Stroke) => void;
  onPointAdded?: (strokeId: string, point: Point) => void;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(
  ({ toolSettings, strokes, zoom = 1, onStrokeComplete, onStrokeStart, onPointAdded }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const committedRef = useRef<HTMLCanvasElement>(null);
    const activeRef    = useRef<HTMLCanvasElement>(null);
    const committedCtx = useRef<CanvasRenderingContext2D | null>(null);
    const activeCtx    = useRef<CanvasRenderingContext2D | null>(null);

    const currentStroke    = useRef<Stroke | null>(null);
    const isDrawing        = useRef(false);
    const rafId            = useRef<number>(0);
    const strokesRef       = useRef(strokes);
    const toolRef          = useRef(toolSettings);
    const zoomRef          = useRef(zoom);
    const onStrokeStartRef = useRef(onStrokeStart);
    const onPointAddedRef  = useRef(onPointAdded);
    strokesRef.current       = strokes;
    toolRef.current          = toolSettings;
    zoomRef.current          = zoom;
    onStrokeStartRef.current = onStrokeStart;
    onPointAddedRef.current  = onPointAdded;

    // Text tool state
    const [textInput, setTextInput]   = useState<{ x: number; y: number } | null>(null);
    const [textValue, setTextValue]   = useState('');
    const textInputRef                 = useRef<HTMLInputElement>(null);
    const onStrokeCompleteRef          = useRef(onStrokeComplete);
    onStrokeCompleteRef.current        = onStrokeComplete;

    const getCSS = () => ({
      w: committedRef.current?.clientWidth  ?? 0,
      h: committedRef.current?.clientHeight ?? 0,
    });

    const setupContexts = useCallback(() => {
      if (!committedRef.current || !activeRef.current) return;
      committedCtx.current = initContext(committedRef.current);
      activeCtx.current    = initContext(activeRef.current);
      const { w, h } = getCSS();
      renderAllStrokes(committedCtx.current, strokesRef.current, w, h);
    }, []);

    useEffect(() => {
      setupContexts();
      const ro = new ResizeObserver(setupContexts);
      if (containerRef.current) ro.observe(containerRef.current);
      return () => ro.disconnect();
    }, [setupContexts]);

    useImperativeHandle(ref, () => ({
      appendStroke(stroke) {
        if (committedCtx.current) renderStroke(committedCtx.current, stroke);
      },
      redrawAll(newStrokes) {
        if (!committedCtx.current) return;
        const { w, h } = getCSS();
        renderAllStrokes(committedCtx.current, newStrokes, w, h);
      },
      clearDrawing() {
        if (!committedCtx.current) return;
        const { w, h } = getCSS();
        committedCtx.current.clearRect(0, 0, w, h);
      },
      exportImage() {
        const { w, h } = getCSS();
        return committedRef.current ? exportCanvasImage(committedRef.current, w, h) : '';
      },
    }));

    // ── RAF draw loop ─────────────────────────────────────────────────────────

    const drawFrame = useCallback(() => {
      const stroke = currentStroke.current;
      const aCx    = activeCtx.current;
      const cCx    = committedCtx.current;
      if (!stroke || !aCx || !cCx) return;

      const { w, h } = getCSS();
      const { tool }  = toolRef.current;

      if (tool === 'eraser') {
        renderAllStrokes(cCx, [...strokesRef.current, stroke], w, h);
      } else {
        aCx.clearRect(0, 0, w, h);
        renderStroke(aCx, stroke);
      }

      if (isDrawing.current) rafId.current = requestAnimationFrame(drawFrame);
    }, []);

    // ── Text tool commit ──────────────────────────────────────────────────────

    const commitText = useCallback(() => {
      if (!textInput) return;
      const val = textValue.trim();
      setTextInput(null);
      setTextValue('');
      if (!val) return;
      const { tool, color, width } = toolRef.current;
      const fontSize = Math.max(16, width * 6);
      const stroke: Stroke = {
        id:        generateId(),
        points:    [{ x: textInput.x, y: textInput.y, pressure: 0.5, timestamp: Date.now() }],
        color,
        width,
        tool:      'text',
        opacity:   1,
        timestamp: Date.now(),
        text:      val,
        fontSize,
      };
      if (committedCtx.current) renderStroke(committedCtx.current, stroke);
      onStrokeCompleteRef.current(stroke);
      void tool;
    }, [textInput, textValue]);

    // ── Pointer event handlers ────────────────────────────────────────────────

    const handlePointerDown = useCallback((e: PointerEvent) => {
      if (!activeRef.current) return;
      e.preventDefault();

      const { tool, color, width } = toolRef.current;

      // Hand tool — no drawing
      if (tool === 'hand') return;

      // Text tool — show input overlay instead of drawing
      if (tool === 'text') {
        const pt = getPointerPoint(e, activeRef.current, zoomRef.current);
        setTextInput({ x: pt.x, y: pt.y });
        setTextValue('');
        setTimeout(() => textInputRef.current?.focus(), 0);
        return;
      }

      activeRef.current.setPointerCapture(e.pointerId);
      const pt = getPointerPoint(e, activeRef.current, zoomRef.current);

      const stroke: Stroke = {
        id:        generateId(),
        points:    [pt],
        color,
        width,
        tool,
        opacity:   tool === 'brush' ? 0.82 : 1.0,
        timestamp: Date.now(),
      };
      currentStroke.current = stroke;
      isDrawing.current = true;
      rafId.current = requestAnimationFrame(drawFrame);
      onStrokeStartRef.current?.(stroke);
    }, [drawFrame]);

    const handlePointerMove = useCallback((e: PointerEvent) => {
      if (!isDrawing.current || !currentStroke.current || !activeRef.current) return;
      e.preventDefault();
      const pt = getPointerPoint(e, activeRef.current, zoomRef.current);
      currentStroke.current.points.push(pt);
      onPointAddedRef.current?.(currentStroke.current.id, pt);
    }, []);

    const handlePointerUp = useCallback(() => {
      if (!isDrawing.current || !currentStroke.current) return;

      cancelAnimationFrame(rafId.current);
      isDrawing.current = false;

      const stroke = currentStroke.current;
      currentStroke.current = null;

      const { w, h } = getCSS();
      activeCtx.current?.clearRect(0, 0, w, h);

      if (stroke.points.length === 0) return;

      if (stroke.tool !== 'eraser') {
        if (committedCtx.current) renderStroke(committedCtx.current, stroke);
      }

      onStrokeCompleteRef.current(stroke);
    }, []);

    useEffect(() => {
      const canvas = activeRef.current;
      if (!canvas) return;
      canvas.addEventListener('pointerdown',   handlePointerDown);
      canvas.addEventListener('pointermove',   handlePointerMove);
      canvas.addEventListener('pointerup',     handlePointerUp);
      canvas.addEventListener('pointercancel', handlePointerUp);
      canvas.addEventListener('pointerleave',  (e) => { if (e.buttons === 0) handlePointerUp(); });
      return () => {
        canvas.removeEventListener('pointerdown',   handlePointerDown);
        canvas.removeEventListener('pointermove',   handlePointerMove);
        canvas.removeEventListener('pointerup',     handlePointerUp);
        canvas.removeEventListener('pointercancel', handlePointerUp);
      };
    }, [handlePointerDown, handlePointerMove, handlePointerUp]);

    const cursor =
      toolSettings.tool === 'eraser' ? 'cell'
      : toolSettings.tool === 'hand' ? 'grab'
      : toolSettings.tool === 'text' ? 'text'
      : 'crosshair';

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{ touchAction: 'none' }}
      >
        <canvas ref={committedRef} className="absolute inset-0 w-full h-full" />
        <canvas
          ref={activeRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor, touchAction: 'none' }}
        />

        {/* Text input overlay — positioned in logical canvas coordinates */}
        {textInput && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{ left: textInput.x, top: textInput.y }}
          >
            <input
              ref={textInputRef}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') commitText();
              }}
              onBlur={commitText}
              className="pointer-events-auto outline-none bg-transparent border-b-2 border-dashed min-w-[80px] px-1"
              style={{
                color:       toolSettings.color,
                fontSize:    Math.max(16, toolSettings.width * 6),
                fontFamily:  "'Comic Sans MS', cursive, sans-serif",
                fontWeight:  'bold',
                borderColor: toolSettings.color,
                caretColor:  toolSettings.color,
              }}
              placeholder="Type here…"
            />
          </div>
        )}
      </div>
    );
  },
);

Canvas.displayName = 'Canvas';
export default Canvas;
