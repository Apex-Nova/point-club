import { useMemo, useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldState } from '../state/worldStore';
import { WORLD } from '../config/worldConfig';

/**
 * Cinematic, living camera. Default framing is slightly elevated and wide,
 * looking toward the workshop under the hero tree. It breathes with a gentle
 * floating drift, parallax-follows the pointer, and pushes in subtly as the
 * scroll timeline advances. Never static.
 */
export default function CameraRig() {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const target = useMemo(() => new THREE.Vector3(WORLD.workshopPosition[0], 1.6, WORLD.workshopPosition[2]), []);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame(({ clock, pointer: p }, _delta) => {
    const cam = camRef.current;
    if (!cam) return;
    const t = clock.elapsedTime;
    const scroll = worldState().scrollProgress;

    // smooth the pointer for parallax
    pointer.current.x += (p.x - pointer.current.x) * 0.04;
    pointer.current.y += (p.y - pointer.current.y) * 0.04;

    // base position: elevated, wide; pushes in + lowers slightly as you scroll
    const baseDist = THREE.MathUtils.lerp(20, 14, scroll);
    const baseHeight = THREE.MathUtils.lerp(8.5, 6.0, scroll);

    // gentle floating drift (non-repetitive)
    const driftX = Math.sin(t * 0.18) * 0.9 + Math.sin(t * 0.07) * 0.5;
    const driftY = Math.cos(t * 0.15) * 0.45;

    cam.position.x = driftX + pointer.current.x * 2.4;
    cam.position.y = baseHeight + driftY + pointer.current.y * 1.2;
    cam.position.z = baseDist;

    cam.lookAt(target.x + pointer.current.x * 1.2, target.y, target.z);
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={42}
      near={0.5}
      far={300}
      position={[0, 8.5, 20]}
    />
  );
}
