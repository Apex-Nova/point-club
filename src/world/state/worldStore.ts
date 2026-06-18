import { create } from 'zustand';
import { WORLD_DEFAULTS } from '../config/worldConfig';

/**
 * Live world state shared between the debug panel, the scroll timeline,
 * and the R3F scene. Read inside useFrame via getState() to avoid re-renders.
 */
interface WorldState {
  /** Global wind multiplier (grass, leaves, branches). */
  windStrength: number;
  /** 0..1 multiplier for Holi powder particle count / opacity. */
  particleDensity: number;
  /** 0..1 fog / haze / mote intensity. */
  atmosphereIntensity: number;
  /** 0..1 scroll-driven master timeline position. */
  scrollProgress: number;
  /** True once all critical assets have loaded. */
  ready: boolean;

  set: (patch: Partial<WorldState>) => void;
}

export const useWorldStore = create<WorldState>(set => ({
  ...WORLD_DEFAULTS,
  ready: false,
  set: patch => set(patch),
}));

/** Non-reactive getter for hot loops (useFrame). */
export const worldState = () => useWorldStore.getState();
