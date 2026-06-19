import { create } from 'zustand';

/** High-level goals the brain schedules. All serve "improve the artwork". */
export type GolemTask =
  | 'inspect'
  | 'measure'
  | 'plan'
  | 'mix'
  | 'fetch'
  | 'paint'
  | 'review'
  | 'celebrate'
  | 'idle';

/** Emotional/interaction states layered on top of the current task. */
export type GolemMood = 'neutral' | 'curious' | 'annoyed' | 'playful' | 'proud' | 'startled';

/** The big scripted set-piece states. */
export type FourthWallPhase =
  | 'none'
  | 'freeze'      // just stained the screen — did anyone notice?
  | 'approach'    // walk to the edge of the world
  | 'reach'       // lean / reach toward the viewer
  | 'emerge'      // partial jump out of the scene
  | 'clean'       // wipe the stain off the screen
  | 'return';     // satisfied, head home

interface GolemState {
  task: GolemTask;
  mood: GolemMood;
  /** 0..1 — how far the artwork has progressed. */
  artProgress: number;
  /** Pointer interaction pressure; rises on repeated hovering, decays over time. */
  distraction: number;
  /** True during the rare "the cursor is helping" follow event. */
  following: boolean;
  fourthWall: FourthWallPhase;
  /** Screen-space stain descriptor, or null. */
  stain: { x: number; y: number; color: string; id: number } | null;

  set: (patch: Partial<GolemState>) => void;
}

export const useGolemStore = create<GolemState>(set => ({
  task: 'idle',
  mood: 'neutral',
  artProgress: 0,
  distraction: 0,
  following: false,
  fourthWall: 'none',
  stain: null,
  set: patch => set(patch),
}));

export const golemState = () => useGolemStore.getState();

// Dev-only: expose for live debugging in the preview console.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __golem: typeof useGolemStore }).__golem = useGolemStore;
}
