import * as THREE from 'three';
import { HOLI } from '../shared';

/**
 * PaintingSystem — owns an offscreen 2D canvas wrapped in a THREE.CanvasTexture.
 * A virtual "pen" wanders the canvas (eased toward an optional user target) and
 * lays down organic strokes: curves, spirals, waves, dabs and abstract doodles.
 * The composition continuously evolves and never repeats exactly, then gently
 * fades so the canvas never fully saturates.
 *
 * `pen` (0..1, 0..1) is exposed so the golem's brush tip can be aligned to the
 * exact spot being painted, and so Holi particles can spawn from real strokes.
 */

type Mode = 'curve' | 'spiral' | 'wave' | 'dab' | 'scribble';

export class PaintingSystem {
  readonly size: number;
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;

  /** normalised pen position on the canvas (0..1) */
  pen = { x: 0.5, y: 0.5 };
  /** velocity of the most recent stroke head, for brush lag cues */
  vel = { x: 0, y: 0 };
  /** colour of the active stroke */
  color = HOLI[0];
  /** true on the frames where fresh pigment was laid (drives particles/audio) */
  justPainted = false;

  private target: { x: number; y: number } | null = null;
  private mode: Mode = 'curve';
  private modeT = 0;
  private modeDuration = 2;
  private t = 0;
  private fadeAccum = 0;
  private seed = Math.random() * 1000;

  constructor(size = 1024) {
    this.size = size;
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
    // warm paper base
    ctx.fillStyle = '#fbf6e9';
    ctx.fillRect(0, 0, size, size);
    this.paperGrain();
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
  }

  private paperGrain() {
    const { ctx, size } = this;
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
    ctx.restore();
  }

  /** Point the pen toward a normalised target (from the user's cursor). */
  setTarget(x: number | null, y?: number) {
    this.target = x === null ? null : { x, y: y as number };
  }

  private pickMode() {
    const modes: Mode[] = ['curve', 'spiral', 'wave', 'dab', 'scribble'];
    this.mode = modes[(Math.random() * modes.length) | 0];
    this.modeDuration = 1.4 + Math.random() * 2.6;
    this.modeT = 0;
    this.color = HOLI[(Math.random() * HOLI.length) | 0];
  }

  /** Advance the painting. dt seconds. Returns the normalised pen position. */
  update(dt: number) {
    this.t += dt;
    this.modeT += dt;
    this.justPainted = false;
    if (this.modeT > this.modeDuration) this.pickMode();

    const { size } = this;
    const prev = { ...this.pen };

    // ── Decide where the pen wants to go ────────────────────────
    let gx: number, gy: number;
    const s = this.seed;
    switch (this.mode) {
      case 'spiral': {
        const a = this.t * 2.2;
        const r = 0.06 + (this.modeT / this.modeDuration) * 0.32;
        gx = 0.5 + Math.cos(a) * r;
        gy = 0.5 + Math.sin(a) * r;
        break;
      }
      case 'wave':
        gx = (this.modeT / this.modeDuration);
        gy = 0.5 + Math.sin(this.t * 4 + s) * 0.28;
        break;
      case 'dab':
        gx = 0.5 + Math.sin(this.t * 1.3 + s) * 0.34;
        gy = 0.5 + Math.cos(this.t * 1.1 + s * 1.3) * 0.34;
        break;
      case 'scribble':
        gx = 0.5 + Math.sin(this.t * 5.3 + s) * 0.3 + Math.sin(this.t * 1.7) * 0.1;
        gy = 0.5 + Math.cos(this.t * 4.1 + s) * 0.3 + Math.cos(this.t * 2.3) * 0.1;
        break;
      default: // curve — smooth flowing path
        gx = 0.5 + Math.sin(this.t * 0.9 + s) * 0.34;
        gy = 0.5 + Math.sin(this.t * 0.7 + s * 0.5) * Math.cos(this.t * 0.4) * 0.34;
    }

    // Blend toward the user's target when present (mouse-guided drawing).
    if (this.target) {
      gx = THREE.MathUtils.lerp(gx, this.target.x, 0.55);
      gy = THREE.MathUtils.lerp(gy, this.target.y, 0.55);
    }

    gx = THREE.MathUtils.clamp(gx, 0.06, 0.94);
    gy = THREE.MathUtils.clamp(gy, 0.06, 0.94);

    // ease pen toward goal → organic, never teleporting
    this.pen.x = THREE.MathUtils.lerp(this.pen.x, gx, Math.min(1, dt * 3.5));
    this.pen.y = THREE.MathUtils.lerp(this.pen.y, gy, Math.min(1, dt * 3.5));
    this.vel.x = this.pen.x - prev.x;
    this.vel.y = this.pen.y - prev.y;

    // ── Lay pigment from prev → pen ─────────────────────────────
    const dist = Math.hypot(this.pen.x - prev.x, this.pen.y - prev.y);
    if (dist > 0.0005) {
      const ctx = this.ctx;
      const x0 = prev.x * size, y0 = prev.y * size;
      const x1 = this.pen.x * size, y1 = this.pen.y * size;
      const w = (this.mode === 'dab' ? 26 : 12) + Math.sin(this.t * 6) * 4;

      ctx.strokeStyle = this.color;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // soft splat at the head for a painterly feel
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(x1, y1, w * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      this.justPainted = true;
    }

    // ── Periodically fade the whole canvas so it keeps evolving ──
    this.fadeAccum += dt;
    if (this.fadeAccum > 0.5) {
      this.fadeAccum = 0;
      this.ctx.save();
      this.ctx.globalAlpha = 0.03;
      this.ctx.fillStyle = '#fbf6e9';
      this.ctx.fillRect(0, 0, size, size);
      this.ctx.restore();
    }

    this.texture.needsUpdate = true;
    return this.pen;
  }

  /** Splash a celebratory burst of colour across the canvas. */
  celebrate() {
    const { ctx, size } = this;
    for (let i = 0; i < 14; i++) {
      ctx.globalAlpha = 0.5 + Math.random() * 0.4;
      ctx.fillStyle = HOLI[(Math.random() * HOLI.length) | 0];
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, 12 + Math.random() * 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}
