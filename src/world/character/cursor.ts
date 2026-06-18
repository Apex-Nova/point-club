import * as THREE from 'three';

/**
 * Projects the 2D pointer onto the workshop ground plane so the golem can look
 * toward / move toward where the cursor "is" in the world. Also tracks pointer
 * activity so behaviours can tell when the user is fidgeting near the golem.
 */
export class CursorTracker {
  /** Pointer position on the ground plane (world space). */
  readonly world = new THREE.Vector3();
  /** Smoothed pointer velocity magnitude (screen units/sec). */
  activity = 0;

  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private last = new THREE.Vector2();
  private hit = new THREE.Vector3();

  update(pointer: THREE.Vector2, camera: THREE.Camera, dt: number) {
    this.ray.setFromCamera(pointer, camera);
    if (this.ray.ray.intersectPlane(this.plane, this.hit)) {
      this.world.copy(this.hit);
    }
    const moved = this.last.distanceTo(pointer);
    this.last.copy(pointer);
    // decay + inject so brief bursts of motion register, then fade
    this.activity = THREE.MathUtils.damp(this.activity, moved / Math.max(dt, 0.001), 4, dt);
  }

  /** Approx distance (world units) from the pointer-on-ground to a point. */
  distanceTo(p: THREE.Vector3): number {
    return this.world.distanceTo(p);
  }
}
