/**
 * Central tunables for the Copper Golem forest world.
 * Phase 1 — world construction. No golem behaviours here.
 */

export const WORLD = {
  /** Ground disc radius (world units). */
  groundRadius: 60,

  /** Seed for deterministic scatter so the forest looks the same every load. */
  seed: 1337,

  /** Foliage population (auto-scaled down on mobile in placement).
   *  Tuned for a forest-bowl: sparse-ish foreground, dense midground, a thick
   *  background tree wall on the rising rim. */
  counts: {
    saplings: 24,     // small midground trees / clusters
    trees: 62,        // midground trees
    bgTrees: 96,      // dense background forest wall on the bowl rim
    bushes: 36,
    undergrowth: 150, // dense leafy floor cover
    flowers: 210,     // colourful flower patches + singles
    petals: 90,       // tiny foreground ground detail
    rocks: 30,
    pebbles: 55,
    mushrooms: 24,
    ferns: 38,
    grass: 8500,      // instanced, layered species
  },

  /** Pond + waterfall feature (terrain is carved/raised to suit). Placed
   *  front-left of the workshop so it sits naturally in the camera framing. */
  // Composition: waterfall → pond → workshop → camera, all on one axis. The
  // camera sits at +z looking toward the workshop, so the water is set BEHIND
  // the workshop at lower z (further from the viewer), framed by the forest.
  pond: {
    center: [2.5, 0, -7] as [number, number, number],
    radius: 5,
    depth: 1.2,        // basin depth below platform level
    waterY: -0.55,     // water surface height (below clearing ground)
  },
  waterfall: {
    position: [2.5, 0, -12] as [number, number, number],
    scale: 5.5,
    rotationY: 0,      // falls face the camera/pond (+z)
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
