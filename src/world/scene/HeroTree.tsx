import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOLIAGE } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { applyWindToTree } from '../shaders/wind';

/**
 * The signature landmark tree. Larger and fuller than the forest scatter, with
 * stronger canopy wind and a slow "breathing" sway so the eye is drawn to it.
 * This is the spot the Copper Golem will eventually work beneath.
 */
export default function HeroTree() {
  const { scene } = useGLTF(FOLIAGE.heroTree);
  const groupRef = useRef<THREE.Group>(null);

  const tree = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    // Stronger sway, high pivot so only the big canopy moves.
    applyWindToTree(clone, { strength: 0.18, pivot: 6.0, frequency: 0.25 });
    return clone;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // very slow magical breathing / lean
    const t = clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 0.25) * 0.012;
    groupRef.current.rotation.x = Math.cos(t * 0.18) * 0.008;
  });

  return (
    <group
      ref={groupRef}
      name="HeroTree"
      position={WORLD.heroTree.position}
      scale={WORLD.heroTree.scale}
    >
      <primitive object={tree} />
    </group>
  );
}
