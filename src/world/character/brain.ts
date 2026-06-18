import type { GolemTask } from '../state/golemStore';
import type { StationName } from './golemConfig';

/**
 * Goal-based scheduler. The golem has ONE objective: improve the giant artwork.
 * Every task serves it. The scheduler picks the next task with weighted, history-
 * aware randomness so the sequence reads as decision-making — not a fixed loop.
 */

export interface TaskPlan {
  task: GolemTask;
  station: StationName;
  /** Seconds to spend on this task (range, picked at runtime). */
  duration: [number, number];
  /** Whether the golem should paint the canvas during this task. */
  paints?: boolean;
}

/** Each task maps to where it happens + how long it takes. */
const TASKS: Record<GolemTask, TaskPlan> = {
  inspect:   { task: 'inspect',   station: 'inspect',     duration: [3, 5] },
  measure:   { task: 'measure',   station: 'canvasLeft',  duration: [4, 6] },
  plan:      { task: 'plan',      station: 'inspect',     duration: [2, 4] },
  mix:       { task: 'mix',       station: 'bench',       duration: [3, 5] },
  fetch:     { task: 'fetch',     station: 'bench',       duration: [2, 3] },
  paint:     { task: 'paint',     station: 'easel',       duration: [5, 8], paints: true },
  review:    { task: 'review',    station: 'inspect',     duration: [3, 4] },
  celebrate: { task: 'celebrate', station: 'inspect',     duration: [2, 3] },
  idle:      { task: 'idle',      station: 'stool',       duration: [5, 9] },
};

/**
 * A loose "creative process" — the golem tends to follow observe → decide →
 * paint → review, but with branching and randomness so it never feels scripted.
 * Returns weighted candidates given the last task and how done the art looks.
 */
function candidates(last: GolemTask, artProgress: number): { task: GolemTask; weight: number }[] {
  const base: Partial<Record<GolemTask, number>> = {
    inspect: 3, measure: 2, plan: 2, mix: 2, fetch: 1.5,
    paint: 4, review: 2, idle: 2,
  };

  // Bias toward the natural next step after the last action.
  const flow: Partial<Record<GolemTask, Partial<Record<GolemTask, number>>>> = {
    inspect: { plan: 4, measure: 3, paint: 2 },
    measure: { plan: 3, paint: 3 },
    plan:    { mix: 3, fetch: 2, paint: 4 },
    mix:     { fetch: 2, paint: 5 },
    fetch:   { paint: 5 },
    paint:   { review: 5, inspect: 2 },
    review:  { paint: 3, inspect: 2, celebrate: 1.5, idle: 2 },
    celebrate: { idle: 3, inspect: 2 },
    idle:    { inspect: 4, plan: 2, measure: 2 },
  };

  const merged: Partial<Record<GolemTask, number>> = { ...base };
  const bias = flow[last] ?? {};
  for (const [t, w] of Object.entries(bias)) {
    merged[t as GolemTask] = (merged[t as GolemTask] ?? 1) + (w as number);
  }
  // The more "done" the art looks, the more the golem reviews/celebrates/idles.
  if (artProgress > 0.7) {
    merged.review = (merged.review ?? 1) + 2;
    merged.celebrate = (merged.celebrate ?? 1) + 2;
    merged.idle = (merged.idle ?? 1) + 2;
    merged.paint = Math.max(1, (merged.paint ?? 1) - 2);
  }
  // Never immediately repeat the same task.
  delete merged[last];

  return Object.entries(merged).map(([task, weight]) => ({ task: task as GolemTask, weight: weight as number }));
}

/** Weighted random pick. */
export function nextTask(last: GolemTask, artProgress: number): TaskPlan {
  const cands = candidates(last, artProgress);
  const total = cands.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of cands) {
    r -= c.weight;
    if (r <= 0) return TASKS[c.task];
  }
  return TASKS.inspect;
}

export function planFor(task: GolemTask): TaskPlan {
  return TASKS[task];
}
