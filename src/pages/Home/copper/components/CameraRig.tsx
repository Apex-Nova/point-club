import { useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraTarget } from '../systems/CameraSystem';

/**
 * CameraRig — drives the scene camera every frame toward the CameraSystem
 * target with spring easing. Subtle pointer parallax by default; on click it
 * focuses toward the golem with a gentle orbit, then smoothly returns. No cuts.
 *
 * `focusRef` is a 0..1 value the scene raises during the click interaction.
 */
export default function CameraRig({
  pointerRef,
  focusRef,
}: {
  pointerRef: RefObject<{ x: number; y: number }>;
  focusRef: RefObject<number>;
}) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 1.6, -1.5));
  const _t = useRef(0);

  useFrame((_, dt) => {
    _t.current += dt;
    const target = cameraTarget({
      pointer: pointerRef.current ?? { x: 0, y: 0 },
      focus: focusRef.current ?? 0,
      time: _t.current,
    });
    // critically-damped-ish easing toward position + lookAt
    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent smoothing
    camera.position.lerp(target.position, k);
    lookAt.current.lerp(target.lookAt, k);
    camera.lookAt(lookAt.current);
  });

  return null;
}
