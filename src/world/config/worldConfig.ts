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
    trees: 26,
    bushes: 18,
    flowers: 40,
    rocks: 22,
    pebbles: 30,
    mushrooms: 14,
    ferns: 16,
    grass: 4200, // instanced
  },

  /** Clear radius around the workshop so props are never buried in foliage. */
  workshopClearRadius: 9,
  /** Workshop sits slightly off-centre so the hero tree frames it. */
  workshopPosition: [2.5, 0, 1] as [number, number, number],

  /** Hero landmark tree placement. */
  heroTree: {
    position: [-9, 0, -6] as [number, number, number],
    scale: 3.4,
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
