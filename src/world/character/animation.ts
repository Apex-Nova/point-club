import * as THREE from 'three';

/** Critically-damped smoothing — gives weight/momentum without overshoot. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

/** Back-ease for anticipation + follow-through (pulls back, then past, then settles). */
export function easeBack(t: number, s = 1.70158): number {
  t = THREE.MathUtils.clamp(t, 0, 1);
  return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
}

/** Smooth 0→1→0 pulse (for one-shot gestures). */
export function pulse(t: number): number {
  return Math.sin(THREE.MathUtils.clamp(t, 0, 1) * Math.PI);
}

/** Shortest signed angle delta a→b. */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Damp an angle toward target along the shortest path. */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  return current + angleDelta(current, target) * (1 - Math.exp(-lambda * dt));
}

/** Heading (rotation.y) that faces from `from` toward `to` on the ground plane. */
export function headingTo(from: THREE.Vector3, to: THREE.Vector3): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}
