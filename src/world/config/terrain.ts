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

/** Terrain height at world (x,z). Flat near the workshop, rolling beyond. */
export function heightAt(x: number, z: number): number {
  const d = Math.hypot(x - wx, z - wz);
  if (d <= PLATFORM_RADIUS) return PLATFORM_TOP;
  if (d <= FLAT_RADIUS) {
    // ease from platform top down to terrain over the flat skirt
    const t = (d - PLATFORM_RADIUS) / (FLAT_RADIUS - PLATFORM_RADIUS);
    return PLATFORM_TOP * (1 - smooth(t)) + waterShaping(x, z) * smooth(t);
  }
  // ramp hills in beyond the flat zone so the edge isn't a step, plus the
  // rising forest-bowl rim that surrounds the clearing on all sides
  const ramp = smooth(Math.min(1, (d - FLAT_RADIUS) / 14));
  return hills(x, z) * 0.9 * ramp + bowl(d) + waterShaping(x, z);
}

/** Surface height the golem/props should stand on (platform-aware). */
export function groundHeightAt(x: number, z: number): number {
  const d = Math.hypot(x - wx, z - wz);
  if (d <= PLATFORM_RADIUS) return PLATFORM_TOP;
  return heightAt(x, z);
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
