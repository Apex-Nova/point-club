import { WORLD } from './worldConfig';

/**
 * Stylized rolling terrain. A single deterministic height field sampled by the
 * ground mesh, foliage placement, and the golem's grounding — so everything sits
 * on the same surface and nothing floats or sinks.
 *
 * The workshop area is kept flat (and raised to the platform top) so props and
 * the golem stay level; terrain rolls gently beyond it.
 */

const [wx, , wz] = WORLD.workshopPosition;
const [px, , pz] = WORLD.pond.center;
const [fx, , fz] = WORLD.waterfall.position;

/** Top surface of the workshop platform (see CanvasWorkshop Platform). */
export const PLATFORM_TOP = 0.22;
/** Grass/terrain level of the clearing floor — BELOW the platform top so the
 *  platform reads as a raised, handcrafted disc rather than flush with ground. */
export const CLEARING_GROUND = -0.18;
/** Flat radius around the workshop before hills begin. */
export const FLAT_RADIUS = WORLD.workshopClearRadius + 1;
/** Platform radius — within this the surface is the platform top. */
export const PLATFORM_RADIUS = 5.0;

/** Layered-sine rolling hills — pronounced for a jungle high/low feel. */
function hills(x: number, z: number): number {
  return (
    Math.sin(x * 0.11) * Math.cos(z * 0.09) * 2.6 +
    Math.sin(x * 0.05 + 1.7) * 1.9 +
    Math.cos(z * 0.06 - 0.6) * 1.6 +
    Math.sin((x + z) * 0.17) * 0.7 +
    Math.cos((x - z) * 0.23 + 2.0) * 0.5
  );
}

/** Forest-bowl rim: ground rises with distance so dense forest surrounds the
 *  clearing on every side and blocks the empty horizon. */
const BOWL_INNER = 11;   // clearing stays low out to here
const BOWL_OUTER = 50;   // fully raised rim by here
const BOWL_HEIGHT = 13;  // how high the surrounding forest floor lifts
function bowl(d: number): number {
  return smooth(Math.min(1, Math.max(0, (d - BOWL_INNER) / (BOWL_OUTER - BOWL_INNER)))) * BOWL_HEIGHT;
}

/** Basin that dips down toward the pond, plus a mound behind the waterfall. */
function waterShaping(x: number, z: number): number {
  let h = 0;
  const dp = Math.hypot(x - px, z - pz);
  if (dp < WORLD.pond.radius + 4) {
    // smooth bowl: deepest at centre, easing back up to the rim
    const t = smooth(Math.min(1, dp / (WORLD.pond.radius + 4)));
    h -= (1 - t) * WORLD.pond.depth;
  }
  const df = Math.hypot(x - fx, z - fz);
  if (df < 10) {
    // raised cliff/hill the waterfall pours from
    const t = smooth(Math.min(1, df / 10));
    h += (1 - t) * 5.5;
  }
  return h;
}

/** Terrain (grass) height at world (x,z). The clearing floor sits at
 *  CLEARING_GROUND; hills + bowl rim rise beyond. The platform is a separate
 *  raised mesh, so terrain here is intentionally below it. */
export function heightAt(x: number, z: number): number {
  const d = Math.hypot(x - wx, z - wz);
  const ramp = smooth(Math.min(1, Math.max(0, (d - FLAT_RADIUS) / 14)));
  return CLEARING_GROUND + hills(x, z) * 0.9 * ramp + bowl(d) + waterShaping(x, z);
}

/** Surface height the golem/props stand on — the platform top inside the
 *  workshop disc, the terrain elsewhere. */
export function groundHeightAt(x: number, z: number): number {
  const d = Math.hypot(x - wx, z - wz);
  if (d <= PLATFORM_RADIUS) return PLATFORM_TOP;
  return heightAt(x, z);
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
