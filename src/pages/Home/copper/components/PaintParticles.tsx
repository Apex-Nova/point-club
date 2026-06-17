import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HOLI } from '../shared';

export interface ParticlesHandle {
  /** emit n pigment particles at a world position (paint strokes / bursts) */
  emit: (pos: THREE.Vector3, n: number, spread?: number, power?: number) => void;
}

/**
 * PaintParticles — one instanced point cloud reused for all pigment effects:
 * Holi-coloured dust drifting off the brush while painting, dust on landing,
 * and the celebration colour burst. Elegant and sparse, not cluttered.
 */
const PaintParticles = forwardRef<ParticlesHandle>((_props, ref) => {
  const COUNT = 360;
  const points = useRef<THREE.Points>(null);
  const head = useRef(0);

  const { positions, colors, vel, life } = useMemo(() => ({
    positions: new Float32Array(COUNT * 3).fill(9999),
    colors: new Float32Array(COUNT * 3),
    vel: new Float32Array(COUNT * 3),
    life: new Float32Array(COUNT),
  }), []);

  useImperativeHandle(ref, () => ({
    emit: (pos, n, spread = 0.3, power = 1) => {
      const c = new THREE.Color();
      for (let k = 0; k < n; k++) {
        const i = head.current;
        head.current = (head.current + 1) % COUNT;
        positions[i * 3] = pos.x + (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * spread;
        positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * spread;
        vel[i * 3] = (Math.random() - 0.5) * power;
        vel[i * 3 + 1] = (Math.random() * 0.6 + 0.2) * power;
        vel[i * 3 + 2] = (Math.random() - 0.5) * power;
        c.set(HOLI[(Math.random() * HOLI.length) | 0]);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        life[i] = 1.0 + Math.random() * 0.8;
      }
    },
  }), [positions, colors, vel, life]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    for (let i = 0; i < COUNT; i++) {
      if (life[i] <= 0) continue;
      life[i] -= d;
      positions[i * 3] += vel[i * 3] * d;
      positions[i * 3 + 1] += vel[i * 3 + 1] * d;
      positions[i * 3 + 2] += vel[i * 3 + 2] * d;
      vel[i * 3 + 1] -= 0.5 * d;
      vel[i * 3] *= 0.97; vel[i * 3 + 2] *= 0.97;
      if (life[i] <= 0) { positions[i * 3] = 9999; positions[i * 3 + 1] = 9999; }
    }
    if (points.current) {
      points.current.geometry.attributes.position.needsUpdate = true;
      points.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
});

PaintParticles.displayName = 'PaintParticles';
export default PaintParticles;
