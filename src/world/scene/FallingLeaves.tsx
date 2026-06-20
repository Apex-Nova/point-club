import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD } from '../config/worldConfig';
import { makeRng } from '../utils/placement';
import { windUniforms } from '../shaders/wind';

/**
 * Atmospheric falling leaves — red/yellow/occasional green, spawned high in the
 * canopy, drifting slowly on the shared wind, tumbling as they fall, recycled
 * to the top when they reach the ground. One InstancedMesh, fixed pool, no
 * per-frame allocation.
 */
const LEAF_COLORS = ['#c0392b', '#e0512b', '#d98a2b', '#e6b54e', '#caa83a', '#5a8f3c'];

export default function FallingLeaves({ lowPerf = false }: { lowPerf?: boolean }) {
  const count = lowPerf ? 20 : 44;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { geometry, material, leaves, dummy } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(0.22, 0.13);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
    const rng = makeRng(WORLD.seed ^ 0x1eaf);
    const R = WORLD.groundRadius * 0.7;
    const leaves = Array.from({ length: count }).map(() => ({
      x: (rng() - 0.5) * 2 * R,
      y: 6 + rng() * 10,
      z: (rng() - 0.5) * 2 * R,
      fall: 0.5 + rng() * 0.7,
      spin: (rng() - 0.5) * 2.5,
      sway: rng() * Math.PI * 2,
      swayAmp: 0.4 + rng() * 0.6,
      rot: new THREE.Euler(rng() * 6, rng() * 6, rng() * 6),
      color: new THREE.Color(LEAF_COLORS[Math.floor(rng() * LEAF_COLORS.length)]),
    }));
    return { geometry, material, leaves, dummy: new THREE.Object3D() };
  }, [count]);

  const colored = useRef(false);
  useFrame((_, dt) => {
    const m = meshRef.current; if (!m) return;
    if (!colored.current) {
      leaves.forEach((l, i) => m.setColorAt(i, l.color));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      colored.current = true;
    }
    dt = Math.min(dt, 0.05);
    const wind = windUniforms.uWind.value;       // shared global wind strength
    leaves.forEach((l, i) => {
      l.y -= l.fall * dt;
      l.sway += dt;
      // drift on the shared wind + gentle sway
      l.x += (0.35 * wind + Math.sin(l.sway) * l.swayAmp * 0.5) * dt;
      l.z += (0.18 * wind + Math.cos(l.sway * 0.8) * l.swayAmp * 0.5) * dt;
      l.rot.x += l.spin * dt; l.rot.z += l.spin * 0.6 * dt;
      if (l.y < -0.2) { l.y = 9 + Math.random() * 6; }   // recycle to canopy
      dummy.position.set(l.x, l.y, l.z);
      dummy.rotation.copy(l.rot);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />;
}
