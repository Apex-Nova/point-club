import type { Stroke, Point } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function drawSmoothPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

// ── Per-tool renderers ────────────────────────────────────────────────────────

function renderPencil(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle   = stroke.color;
  ctx.lineWidth   = stroke.width;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.globalAlpha = 1;
  drawSmoothPath(ctx, stroke.points);
}

function renderMarker(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle   = stroke.color;
  ctx.lineWidth   = stroke.width * 2;
  ctx.lineCap     = 'square';
  ctx.lineJoin    = 'miter';
  ctx.globalAlpha = 1;
  drawSmoothPath(ctx, stroke.points);
}

function renderBrush(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle   = stroke.color;
  ctx.lineWidth   = stroke.width * 2.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.globalAlpha = 0.78;
  ctx.shadowBlur  = 8;
  ctx.shadowColor = stroke.color;
  drawSmoothPath(ctx, stroke.points);
}

function renderHighlighter(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth   = stroke.width * 6;
  ctx.lineCap     = 'square';
  ctx.lineJoin    = 'round';
  ctx.globalAlpha = 0.3;
  drawSmoothPath(ctx, stroke.points);
}

function renderSpray(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points, color, width } = stroke;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = color;
  const radius  = width * 4;
  const density = Math.max(10, width * 3);

  for (const pt of points) {
    for (let i = 0; i < density; i++) {
      const angle   = Math.random() * Math.PI * 2;
      const r       = Math.sqrt(Math.random()) * radius;
      const x       = pt.x + Math.cos(angle) * r;
      const y       = pt.y + Math.sin(angle) * r;
      const dotSize = Math.random() * 1.2 + 0.3;
      ctx.globalAlpha = Math.random() * 0.5 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderCalligraphy(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points, color, width } = stroke;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle   = color;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 1;

  const NIB_ANGLE = Math.PI / 4; // 45° nib
  const nibW = width * 2.2;
  const nibH = width * 0.35;

  const pts = points.length === 1 ? [points[0], points[0]] : points;
  for (let i = 0; i < pts.length; i++) {
    ctx.save();
    ctx.translate(pts[i].x, pts[i].y);
    ctx.rotate(NIB_ANGLE);
    ctx.fillRect(-nibW / 2, -nibH / 2, nibW, nibH);
    ctx.restore();
  }

  // Connect dots with a thin path to avoid gaps
  if (pts.length > 1) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = nibH;
    ctx.lineCap     = 'butt';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  }
}

function renderEraser(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.fillStyle   = 'rgba(0,0,0,1)';
  ctx.lineWidth   = stroke.width * 3;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  drawSmoothPath(ctx, stroke.points);
}

function renderText(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (!stroke.text || stroke.points.length === 0) return;
  const fontSize = stroke.fontSize ?? Math.max(16, stroke.width * 6);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle   = stroke.color;
  ctx.font        = `bold ${fontSize}px 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  const { points, tool } = stroke;
  if (points.length === 0 && tool !== 'text') return;

  ctx.save();
  switch (tool) {
    case 'pencil':      renderPencil(ctx, stroke);      break;
    case 'marker':      renderMarker(ctx, stroke);      break;
    case 'brush':       renderBrush(ctx, stroke);       break;
    case 'highlighter': renderHighlighter(ctx, stroke); break;
    case 'spray':       renderSpray(ctx, stroke);       break;
    case 'calligraphy': renderCalligraphy(ctx, stroke); break;
    case 'eraser':      renderEraser(ctx, stroke);      break;
    case 'text':        renderText(ctx, stroke);        break;
    case 'hand':        break;
    default:            renderPencil(ctx, stroke);      break;
  }
  ctx.restore();
}

export function renderAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  cssWidth: number,
  cssHeight: number,
): void {
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  for (const stroke of strokes) renderStroke(ctx, stroke);
}

// Use offsetWidth/offsetHeight so CSS transforms on parent elements don't
// inflate the canvas resolution.
export function initContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  const w   = canvas.offsetWidth  || canvas.clientWidth  || 1;
  const h   = canvas.offsetHeight || canvas.clientHeight || 1;
  canvas.width  = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return ctx;
}

// zoom is the scale factor (1 = 100%, 1.5 = 150%).
// getBoundingClientRect() returns visual (post-transform) coords, so we
// divide by zoom to get logical canvas coordinates.
export function getPointerPoint(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
  zoom = 1,
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x:        (e.clientX - rect.left) / zoom,
    y:        (e.clientY - rect.top)  / zoom,
    pressure: e.pressure > 0 ? e.pressure : 0.5,
    timestamp: Date.now(),
  };
}

export function exportCanvasImage(
  committedCanvas: HTMLCanvasElement,
  _cssWidth: number,
  _cssHeight: number,
): string {
  const off = document.createElement('canvas');
  off.width  = committedCanvas.width;
  off.height = committedCanvas.height;
  const ctx  = off.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, off.width, off.height);
  ctx.drawImage(committedCanvas, 0, 0);
  return off.toDataURL('image/png');
}

export function getEffectiveWidth(stroke: Stroke): number {
  return stroke.width;
}
