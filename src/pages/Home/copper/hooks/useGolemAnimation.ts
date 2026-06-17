import { useMemo } from 'react';
import * as THREE from 'three';
import { Spring } from '../systems/PhysicsSystem';
import type { GolemState } from '../systems/GolemStateMachine';
import type { InteractionPose } from '../systems/InteractionSystem';
import { GOLEM_BASE_Y } from '../shared';

export interface GolemRefs {
  root: THREE.Group | null;     // whole golem (position/yaw)
  body: THREE.Group | null;     // torso (breathing, squash, spin)
  head: THREE.Group | null;     // head (look tracking, tilt)
  eyeL: THREE.Mesh | null;
  eyeR: THREE.Mesh | null;
  armR: THREE.Group | null;     // brush arm
  legL: THREE.Group | null;
  legR: THREE.Group | null;
}

export interface GolemFrame {
  dt: number;
  time: number;
  state: GolemState;
  /** world x the golem is walking toward (its slot in front of the canvas) */
  targetX: number;
  /** where on the canvas the pen is (0..1), for arm reach + head aim */
  penU: number;
  penV: number;
  /** look-at-user blend during interaction (0 canvas .. 1 viewer) */
  faceUser: number;
  pose: InteractionPose;
}

/**
 * useGolemAnimation — encapsulates all the spring state for the Copper Golem
 * and applies a fully blended pose to the part refs each frame. Every channel
 * is spring-smoothed so state changes never snap.
 */
export function useGolemAnimation() {
  const s = useMemo(() => ({
    posX: new Spring(0, 60, 14),
    yaw: new Spring(0, 80, 16),
    headYaw: new Spring(0, 90, 14),
    headPitch: new Spring(0, 90, 14),
    breathe: new Spring(0, 40, 10),
    armReach: new Spring(0, 70, 13),
    squashY: new Spring(1, 140, 16),
    squashXZ: new Spring(1, 140, 16),
    lift: new Spring(0, 120, 14),
    blink: 1,
    blinkClock: Math.random() * 4,
  }), []);

  const update = (refs: GolemRefs, f: GolemFrame) => {
    const { dt, time, state, targetX, penU, penV, faceUser, pose } = f;
    const painting = state === 'painting' || state === 'excited';
    const walking = state === 'walking';

    // ── Position: ease along the canvas, plus interaction step-back / jump ──
    const px = s.posX.update(targetX, dt);
    const lift = s.lift.update(pose.jumpY, dt);
    if (refs.root) {
      refs.root.position.x = px;
      refs.root.position.y = GOLEM_BASE_Y + lift;
      refs.root.position.z = pose.stepBack; // toward viewer
    }

    // ── Yaw: ¾-back to camera so it faces the canvas while working; turns to
    //     the user during the click interaction; full spin on celebration. ──
    const wantYaw = THREE.MathUtils.lerp(Math.PI - 0.5, 0, faceUser) + pose.spin
      + Math.sin(time * 0.6) * (painting ? 0.05 : 0.03);
    const yaw = s.yaw.update(wantYaw, dt);
    if (refs.body) {
      refs.body.rotation.y = yaw; // body authored facing +Z → π faces the canvas (−Z)
      // breathing + squash & stretch
      const breath = 1 + Math.sin(time * 1.4) * 0.02;
      const sqY = s.squashY.update(pose.squashY, dt);
      const sqXZ = s.squashXZ.update(pose.squashXZ, dt);
      refs.body.scale.set(sqXZ, breath * sqY, sqXZ);
    }
    void s.breathe;

    // ── Head: aim at the pen on the canvas, tilt when looking around ──
    let hYaw = (penU - 0.5) * 0.7;
    let hPitch = (penV - 0.5) * 0.4;
    if (state === 'lookingAround') { hYaw = Math.sin(time * 0.8) * 0.6; hPitch = -0.15; }
    if (faceUser > 0.01) { hYaw = THREE.MathUtils.lerp(hYaw, 0, faceUser); hPitch = THREE.MathUtils.lerp(hPitch, 0.1, faceUser); }
    if (refs.head) {
      refs.head.rotation.y = s.headYaw.update(hYaw, dt);
      refs.head.rotation.x = s.headPitch.update(hPitch, dt);
      refs.head.rotation.z = state === 'lookingAround' ? Math.sin(time * 0.7) * 0.12 : 0;
    }

    // ── Blink ──
    s.blinkClock -= dt;
    if (s.blinkClock <= 0) { s.blink = 0; s.blinkClock = 2.5 + Math.random() * 3.5; }
    s.blink = THREE.MathUtils.lerp(s.blink, 1, dt * 14);
    const eyeScale = THREE.MathUtils.clamp(s.blink < 0.2 ? 0.1 : s.blink, 0.1, 1);
    if (refs.eyeL) refs.eyeL.scale.y = eyeScale;
    if (refs.eyeR) refs.eyeR.scale.y = eyeScale;

    // ── Brush arm: reach toward the pen height while painting, wave on cue ──
    const reachTarget = painting ? 0.6 + (1 - penV) * 0.5 : 0.2;
    const reach = s.armReach.update(reachTarget + pose.wave, dt);
    if (refs.armR) {
      refs.armR.rotation.x = -reach + (painting ? Math.sin(time * 7) * 0.12 : 0);
      refs.armR.rotation.z = -0.2 - pose.wave * 0.3;
    }

    // ── Legs: simple walk cycle when moving ──
    const stride = walking ? Math.sin(time * 9) * 0.5 : Math.sin(time * 2) * 0.04;
    if (refs.legL) refs.legL.rotation.x = stride;
    if (refs.legR) refs.legR.rotation.x = -stride;
  };

  return { update };
}
