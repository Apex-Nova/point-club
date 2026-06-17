import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { CANVAS_CENTER, CANVAS_W, CANVAS_H } from '../shared';

/**
 * useMouseTarget — converts the cursor into a target on the giant canvas.
 * The scene reports pointer-move world points (from the R3F event) and this
 * maps them onto the canvas plane, returning a normalised (u,v) in 0..1 plus
 * the world point, so the golem can walk toward it and paint that region.
 *
 * A spring-eased internal target avoids teleporting when the cursor jumps.
 */
export function useMouseTarget() {
  // normalised target on the canvas, eased
  const uv = useRef({ x: 0.5, y: 0.5 });
  const desired = useRef({ x: 0.5, y: 0.5 });
  const active = useRef(false);
  const world = useRef(new THREE.Vector3(CANVAS_CENTER.x, CANVAS_CENTER.y, CANVAS_CENTER.z));

  /** Feed a world-space point (e.g. from onPointerMove e.point). */
  const setFromWorld = useCallback((p: THREE.Vector3) => {
    const u = THREE.MathUtils.clamp((p.x - CANVAS_CENTER.x) / CANVAS_W + 0.5, 0.05, 0.95);
    const v = THREE.MathUtils.clamp(0.5 - (p.y - CANVAS_CENTER.y) / CANVAS_H, 0.05, 0.95);
    desired.current = { x: u, y: v };
    active.current = true;
  }, []);

  const clear = useCallback(() => { active.current = false; }, []);

  /** Advance the eased target; call once per frame. Returns null when idle. */
  const update = useCallback((dt: number) => {
    if (!active.current) return null;
    uv.current.x = THREE.MathUtils.lerp(uv.current.x, desired.current.x, Math.min(1, dt * 2.5));
    uv.current.y = THREE.MathUtils.lerp(uv.current.y, desired.current.y, Math.min(1, dt * 2.5));
    world.current.set(
      CANVAS_CENTER.x + (uv.current.x - 0.5) * CANVAS_W,
      CANVAS_CENTER.y - (uv.current.y - 0.5) * CANVAS_H,
      CANVAS_CENTER.z,
    );
    return { u: uv.current.x, v: uv.current.y, world: world.current };
  }, []);

  return { setFromWorld, clear, update };
}
