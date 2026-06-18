import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  url: string;
  /** Desired real-world height in world units; model is uniformly scaled to fit. */
  targetHeight: number;
  position?: [number, number, number];
  rotationY?: number;
  castShadow?: boolean;
  /** If true, sit the model's base on y=0 of its local group. */
  groundIt?: boolean;
}

/**
 * Loads a prop GLB and normalizes it to a target height regardless of the
 * source export scale, so props from different packs sit together correctly.
 */
export default function PropModel({
  url, targetHeight, position = [0, 0, 0], rotationY = 0, castShadow = true, groundIt = true,
}: Props) {
  const { scene } = useGLTF(url);

  const node = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = castShadow; m.receiveShadow = true; }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = size.y > 0 ? targetHeight / size.y : 1;
    clone.scale.setScalar(s);
    // recompute after scaling to drop base onto y=0
    const box2 = new THREE.Box3().setFromObject(clone);
    if (groundIt) clone.position.y = -box2.min.y;
    // center horizontally
    const center = new THREE.Vector3();
    box2.getCenter(center);
    clone.position.x = -center.x;
    clone.position.z = -center.z;
    return clone;
  }, [scene, targetHeight, castShadow, groundIt]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <primitive object={node} />
    </group>
  );
}
