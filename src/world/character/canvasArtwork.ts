import * as THREE from 'three';

/**
 * The giant canvas's evolving artwork. A single offscreen 2D canvas is drawn to
 * progressively as the golem paints; a THREE.CanvasTexture mirrors it onto the
 * easel board. The composition is a planned stylized forest scene, so strokes
 * look meaningful and the picture visibly develops — not random scribbles.
 */

const W = 1024;
const H = 768;

let ctx: CanvasRenderingContext2D | null = null;
let texture: THREE.CanvasTexture | null = null;
let stepIndex = 0;

/** Ordered composition: each entry paints one meaningful element. */
type Stroke = (c: CanvasRenderingContext2D) => void;

const sky = '#eaf2ff';
const COMPOSITION: Stroke[] = [
  // 1. wash / sky gradient
  c => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sky); g.addColorStop(1, '#fbf6e9');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  },
  // 2. sun
  c => { c.fillStyle = '#ffcf5c'; c.beginPath(); c.arc(W * 0.78, H * 0.22, 70, 0, 7); c.fill(); },
  // 3. distant hills
  c => { c.fillStyle = '#bcd9a8'; blob(c, [[0, 560], [260, 470], [520, 540], [780, 460], [1024, 540], [1024, 768], [0, 768]]); },
  // 4. ground
  c => { c.fillStyle = '#6e9e54'; blob(c, [[0, 600], [1024, 580], [1024, 768], [0, 768]]); },
  // 5. left tree trunk
  c => { c.strokeStyle = '#6b4a2b'; c.lineWidth = 26; line(c, 230, 620, 230, 380); },
  // 6. left foliage
  c => cloud(c, 230, 350, 120, '#3f8f4e'),
  // 7. right tree trunk
  c => { c.strokeStyle = '#5b3d22'; c.lineWidth = 22; line(c, 780, 640, 800, 430); },
  // 8. right foliage (autumn — matches hero tree)
  c => cloud(c, 800, 400, 110, '#c0392b'),
  // 9. small centre sapling
  c => { c.strokeStyle = '#6b4a2b'; c.lineWidth = 12; line(c, 510, 660, 512, 560); cloud(c, 512, 540, 60, '#52b788'); },
  // 10. flowers (Holi pops)
  c => { dot(c, 360, 690, 14, '#ff6fae'); dot(c, 430, 705, 12, '#ffcf5c'); dot(c, 600, 700, 13, '#5bc0eb'); dot(c, 680, 715, 11, '#ff9f45'); },
  // 11. birds
  c => { c.strokeStyle = '#33414d'; c.lineWidth = 5; bird(c, 560, 150); bird(c, 640, 190); bird(c, 700, 140); },
  // 12. signature flourish
  c => { c.strokeStyle = '#9b5de5'; c.lineWidth = 6; c.beginPath(); c.moveTo(120, 700); c.bezierCurveTo(160, 660, 200, 720, 250, 680); c.stroke(); },
];

function ensure() {
  if (ctx && texture) return;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f6f1e4';
  ctx.fillRect(0, 0, W, H);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = true;
  // paint the sky wash immediately so the canvas isn't blank-blank
  COMPOSITION[0](ctx);
  stepIndex = 1;
  texture.needsUpdate = true;
}

/** Texture for the easel board to use as its map. */
export function getArtworkTexture(): THREE.CanvasTexture {
  ensure();
  return texture!;
}

/** Paint the next element(s) of the composition. Returns 0..1 progress. */
export function paintNext(count = 1): number {
  ensure();
  for (let i = 0; i < count && stepIndex < COMPOSITION.length; i++) {
    COMPOSITION[stepIndex](ctx!);
    stepIndex++;
  }
  texture!.needsUpdate = true;
  return stepIndex / COMPOSITION.length;
}

export function artworkProgress(): number {
  return stepIndex / COMPOSITION.length;
}

export function artworkComplete(): boolean {
  return stepIndex >= COMPOSITION.length;
}

// ── tiny drawing helpers ─────────────────────────────────────────────
function line(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
}
function blob(c: CanvasRenderingContext2D, pts: number[][]) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(p => c.lineTo(p[0], p[1]));
  c.closePath(); c.fill();
}
function cloud(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  c.fillStyle = color;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    c.beginPath(); c.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.5, r * 0.55, 0, 7); c.fill();
  }
  c.beginPath(); c.arc(x, y, r * 0.7, 0, 7); c.fill();
}
function dot(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}
function bird(c: CanvasRenderingContext2D, x: number, y: number) {
  c.beginPath(); c.moveTo(x - 16, y); c.quadraticCurveTo(x, y - 14, x + 16, y); c.stroke();
}
