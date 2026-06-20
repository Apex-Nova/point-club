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
  // Look slightly above the workshop so the easel/golem sit in frame and the
  // background forest + sky stay visible above them.
  const target = useMemo(() => new THREE.Vector3(WORLD.workshopPosition[0], 2.4, WORLD.workshopPosition[2]), []);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame(({ clock, pointer: p }, _delta) => {
    const cam = camRef.current;
    if (!cam) return;
    const t = clock.elapsedTime;
    const scroll = worldState().scrollProgress;

    // smooth the pointer for parallax
    pointer.current.x += (p.x - pointer.current.x) * 0.04;
    pointer.current.y += (p.y - pointer.current.y) * 0.04;

    // Near ground-level: the viewer stands at the edge of the clearing looking
    // INTO the golem's world. Low height keeps a sense of scale; pushes in a
    // touch as you scroll. Never top-down.
    // Pulled back + wide so the world reads ~70% / platform ~30%; still low and
    // looking slightly across the scene (never top-down).
    const baseDist = THREE.MathUtils.lerp(19, 15, scroll);
    const baseHeight = THREE.MathUtils.lerp(3.6, 3.0, scroll);

    // gentle floating drift (non-repetitive)
    const driftX = Math.sin(t * 0.16) * 0.7 + Math.sin(t * 0.07) * 0.4;
    const driftY = Math.cos(t * 0.13) * 0.22;

    cam.position.x = driftX + pointer.current.x * 1.8;
    cam.position.y = baseHeight + driftY + pointer.current.y * 0.8;
    cam.position.z = baseDist;

    cam.lookAt(target.x + pointer.current.x * 1.0, target.y, target.z);
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={50}
      near={0.3}
      far={300}
      position={[0, 3.6, 19]}
    />
  );
}
