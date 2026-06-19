/**
 * Central tunables for the Copper Golem forest world.
 * Phase 1 — world construction. No golem behaviours here.
 */

export const WORLD = {
  /** Ground disc radius (world units). */
  groundRadius: 60,

  /** Seed for deterministic scatter so the forest looks the same every load. */
  seed: 1337,

  /** Foliage population (auto-scaled down on mobile in placement). */
  counts: {
    trees: 46,
    bgTrees: 60,      // dense background ring for depth
    bushes: 46,
    undergrowth: 220, // dense leafy floor cover (the lush jungle look)
    flowers: 160,     // colourful flower patches
    rocks: 38,
    pebbles: 60,
    mushrooms: 30,
    ferns: 44,
    grass: 14000,     // instanced, layered species
  },

  /** Pond + waterfall feature (terrain is carved/raised to suit). Placed
   *  front-left of the workshop so it sits naturally in the camera framing. */
  pond: {
    center: [-8, 0, 7] as [number, number, number],
    radius: 4.6,
    depth: 1.1,        // basin depth below platform level
    waterY: -0.35,     // water surface height
  },
  waterfall: {
    position: [-14, 0, 11.5] as [number, number, number],
    scale: 5,
    rotationY: 2.4,    // face the falls toward the pond/camera
  },

  /** Clear radius around the workshop so props are never buried in foliage. */
  workshopClearRadius: 9,
  /** Workshop sits slightly off-centre so the hero tree frames it. */
  workshopPosition: [2.5, 0, 1] as [number, number, number],

  /** Hero landmark tree placement. */
  heroTree: {
    position: [-10, 0, -7] as [number, number, number],
    scale: 4.6,
  },

  /** Holi powder palette — tinted in-shader from white sprites. */
  holiColors: ['#3fae8f', '#ffcf5c', '#ff6fae', '#5bc0eb', '#ff9f45'] as const,
} as const;

/** Default values for the live-tunable world state (debug panel overrides these). */
export const WORLD_DEFAULTS = {
  windStrength: 1.0,
  particleDensity: 0.45,
  atmosphereIntensity: 0.4,
  scrollProgress: 0,
} as const;
