import * as THREE from 'three';
import { WORLD } from '../config/worldConfig';

const [wx, , wz] = WORLD.workshopPosition;

/** Named work stations the golem moves between. All in world space. */
export const STATIONS = {
  easel: new THREE.Vector3(wx - 1.4, 0, wz + 2.6),       // primary painting spot, faces canvas
  canvasLeft: new THREE.Vector3(wx - 2.4, 0, wz + 2.4),  // compare left section
  canvasRight: new THREE.Vector3(wx - 0.2, 0, wz + 2.4), // compare right section
  inspect: new THREE.Vector3(wx - 1.4, 0, wz + 3.6),     // step back to evaluate
  bench: new THREE.Vector3(wx + 3, 0, wz + 1.2),         // workbench: mix / fetch paint
  stool: new THREE.Vector3(wx + 1.2, 0, wz + 3.4),       // idle resting spot
} as const;

export type StationName = keyof typeof STATIONS;

/** Where the canvas surface sits (look target when inspecting/painting). */
export const CANVAS_FOCUS = new THREE.Vector3(wx, 2.1, wz + 0.2);

export const GOLEM = {
  /** Stands ~1.6 units tall by the easel. */
  height: 1.7,
  /** Hop-walk speed (units/sec). */
  walkSpeed: 2.0,
  /** How high each hop lifts. */
  hopHeight: 0.14,
  /** Hop cadence (hops/sec). */
  hopRate: 3.2,
};
