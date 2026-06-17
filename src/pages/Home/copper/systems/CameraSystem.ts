import * as THREE from 'three';

/**
 * CameraSystem — computes the cinematic camera target each frame. Default is a
 * wide framing of the canvas + forest with subtle pointer parallax. During the
 * click interaction it eases toward the golem with a gentle orbit, then returns.
 * The CameraRig component spring-interpolates toward these targets (no cuts).
 */

const BASE_POS    = new THREE.Vector3(0, 1.4, 9.2);
const BASE_LOOK   = new THREE.Vector3(0, 1.6, -1.5);
const FOCUS_LOOK  = new THREE.Vector3(0, 0.6, -0.6); // the golem

export interface CameraInput {
  pointer: { x: number; y: number };  // -1..1
  /** 0 = wide default, 1 = fully focused on golem (during interaction) */
  focus: number;
  /** seconds, drives the orbit while focused */
  time: number;
}

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

export function cameraTarget(input: CameraInput): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  const { pointer, focus, time } = input;

  // wide framing + parallax drift
  _pos.copy(BASE_POS);
  _pos.x += pointer.x * 0.8;
  _pos.y += pointer.y * 0.5;

  // focused framing: closer, lower, slight orbit
  if (focus > 0.001) {
    const orbit = Math.sin(time * 0.8) * 0.6;
    const focusPos = new THREE.Vector3(orbit, 0.7, 5.2);
    _pos.lerp(focusPos, focus);
  }

  _look.copy(BASE_LOOK).lerp(FOCUS_LOOK, focus);
  return { position: _pos, lookAt: _look };
}
