import { WORLD } from '../config/worldConfig';

/** Deterministic PRNG (mulberry32) so the forest scatter is identical each load. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Placed {
  position: [number, number, number];
  rotationY: number;
  scale: number;
  modelIndex: number;
}

interface ScatterOpts {
  count: number;
  models: number; // number of model variants to round-robin across
  radius?: number;
  innerHole?: number; // keep this radius around origin empty (workshop)
  minScale?: number;
  maxScale?: number;
  rng: () => number;
  /** Avoid points within this distance of these xz centres. */
  avoid?: { x: number; z: number; r: number }[];
}

/** Scatter items in a disc with natural-looking jitter, scale and rotation variance. */
export function scatter(opts: ScatterOpts): Placed[] {
  const {
    count, models, rng,
    radius = WORLD.groundRadius,
    innerHole = 0,
    minScale = 0.8,
    maxScale = 1.25,
    avoid = [],
  } = opts;

  const out: Placed[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 40) {
    guard++;
    // sqrt for uniform area distribution, biased outward from the hole
    const r = innerHole + Math.sqrt(rng()) * (radius - innerHole);
    const a = rng() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (avoid.some(c => Math.hypot(x - c.x, z - c.z) < c.r)) continue;
    out.push({
      position: [x, 0, z],
      rotationY: rng() * Math.PI * 2,
      scale: minScale + rng() * (maxScale - minScale),
      modelIndex: Math.floor(rng() * models),
    });
  }
  return out;
}

/** Mobile/perf scale-down for population counts. */
export function scaleCount(count: number, isLowPerf: boolean) {
  return isLowPerf ? Math.round(count * 0.45) : count;
}
