import * as THREE from 'three';

/**
 * PhysicsSystem — lightweight critically-damped spring helpers used for the
 * fine secondary motion that Rapier doesn't drive directly (head tracking,
 * brush bristle lag, squash & stretch, camera easing). Rapier owns the rigid
 * bodies (golem capsule, brush, props); these springs own the "feel".
 */

/** Critically-damped spring toward a scalar target. */
export class Spring {
  value: number;
  private vel = 0;
  constructor(initial = 0, private stiffness = 120, private damping = 18) {
    this.value = initial;
  }
  set(stiffness: number, damping: number) {
    this.stiffness = stiffness;
    this.damping = damping;
    return this;
  }
  update(target: number, dt: number) {
    const d = Math.min(dt, 1 / 30);
    const a = this.stiffness * (target - this.value) - this.damping * this.vel;
    this.vel += a * d;
    this.value += this.vel * d;
    return this.value;
  }
}

/** Critically-damped spring toward a Vector3 target (allocation-free). */
export class SpringVec3 {
  value = new THREE.Vector3();
  private vel = new THREE.Vector3();
  private _a = new THREE.Vector3();
  constructor(initial?: THREE.Vector3, private stiffness = 90, private damping = 16) {
    if (initial) this.value.copy(initial);
  }
  update(target: THREE.Vector3, dt: number) {
    const d = Math.min(dt, 1 / 30);
    this._a.copy(target).sub(this.value).multiplyScalar(this.stiffness)
      .addScaledVector(this.vel, -this.damping);
    this.vel.addScaledVector(this._a, d);
    this.value.addScaledVector(this.vel, d);
    return this.value;
  }
}

/** Trailing value with simple lag — used for brush bristle drag. */
export class Lag {
  value = new THREE.Vector3();
  constructor(private rate = 8) {}
  update(target: THREE.Vector3, dt: number) {
    this.value.lerp(target, Math.min(1, dt * this.rate));
    return this.value;
  }
}
