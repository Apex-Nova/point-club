import * as THREE from 'three';
import { WORLD } from '../config/worldConfig';
import { PLATFORM_TOP } from '../config/terrain';

const [wx, , wz] = WORLD.workshopPosition;

/** Named work stations the golem moves between. All in world space (xz; y is
 *  resolved from the terrain/platform each frame). */
export const STATIONS = {
  easel: new THREE.Vector3(wx - 1.4, 0, wz + 2.6),       // primary painting spot, faces canvas
  canvasLeft: new THREE.Vector3(wx - 2.4, 0, wz + 2.6),  // compare left section
  canvasRight: new THREE.Vector3(wx - 0.2, 0, wz + 2.6), // compare right section
  inspect: new THREE.Vector3(wx - 1.4, 0, wz + 3.8),     // step back to evaluate
  bench: new THREE.Vector3(wx + 2.4, 0, wz + 2.2),        // beside the workbench
  stool: new THREE.Vector3(wx + 1.4, 0, wz + 3.6),        // idle resting spot
} as const;

export type StationName = keyof typeof STATIONS;

/** Where the canvas surface sits (look target when inspecting/painting). */
export const CANVAS_FOCUS = new THREE.Vector3(wx, PLATFORM_TOP + 2.0, wz + 0.2);

/** Soft cylinder obstacles the golem steers around (world xz + radius). */
export const OBSTACLES: { x: number; z: number; r: number }[] = [
  { x: wx, z: wz + 0.1, r: 1.3 },        // easel + canvas
  { x: wx + 3.0, z: wz + 1.2, r: 0.9 },  // workbench
];

export const GOLEM = {
  /** Stands ~1.7 units tall by the easel. */
  height: 1.7,
  /** Walk speed (units/sec). */
  walkSpeed: 1.6,
  /** Subtle walk bob (NOT a hop — keeps it an artist, not a rabbit). */
  bobHeight: 0.045,
  /** Step cadence (steps/sec). */
  stepRate: 2.6,
  /**
   * Yaw added when applying the model's facing. The imported model's forward
   * axis is offset from +Z; this aligns "faces movement direction" correctly.
   */
  facingOffset: Math.PI,
};
