const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export interface ColorPalette {
  name:   string;
  colors: string[];
  vibe:   string;
}

export async function getDrawingIdeas(context: string): Promise<string[]> {
  const r = await fetch(`${API}/api/ai/inspire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });
  const d = await r.json() as { ideas: string[] };
  return d.ideas ?? [];
}

export async function getColorPalettes(mood: string): Promise<ColorPalette[]> {
  const r = await fetch(`${API}/api/ai/colors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood }),
  });
  const d = await r.json() as { palettes: ColorPalette[] };
  return d.palettes ?? [];
}

// ── Client-side shape recognition ────────────────────────────────────────────
// Analyses a stroke's bounding box aspect ratio + point distribution
// to classify it as a known shape.

export type RecognizedShape = 'circle' | 'rectangle' | 'triangle' | 'arrow' | 'line' | null;

interface Point { x: number; y: number }

export function recognizeShape(points: Point[]): RecognizedShape {
  if (points.length < 4) return null;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX, h = maxY - minY;
  if (w < 5 && h < 5) return null;

  const aspect = w / (h || 1);
  const spread = points.length;

  // Arrow: mostly horizontal or vertical line with a sharp direction change
  if ((aspect > 3 || aspect < 0.33) && spread < 15) return 'arrow';

  // Line: very thin bounding box
  if (aspect > 5 || aspect < 0.2) return 'line';

  // Check if path is roughly circular: compare avg dist from centroid
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const dists = points.map(p => Math.hypot(p.x - cx, p.y - cy));
  const avgDist = dists.reduce((a, b) => a + b, 0) / dists.length;
  const variance = dists.reduce((a, b) => a + (b - avgDist) ** 2, 0) / dists.length;
  const isCircular = variance < (avgDist * 0.3) ** 2;
  if (isCircular && spread > 10) return 'circle';

  // Triangle: check for roughly 3 direction changes
  if (spread < 8 && aspect > 0.5 && aspect < 2) return 'triangle';

  // Rectangle: near-square bounding box, corners evident
  if (aspect > 0.7 && aspect < 1.4) return 'rectangle';

  return null;
}

// ── Canvas smoothing (sketch cleanup) ────────────────────────────────────────
// Applies Chaikin curve smoothing to rough strokes.

export function smoothPoints(points: Point[], iterations = 2): Point[] {
  let pts = points;
  for (let i = 0; i < iterations; i++) {
    const next: Point[] = [];
    for (let j = 0; j < pts.length - 1; j++) {
      const p0 = pts[j], p1 = pts[j + 1];
      next.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      next.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    pts = next;
  }
  return pts;
}
