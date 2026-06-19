import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scatter, type Placed } from '../../utils/placement';
import { applyWindToTree } from '../../shaders/wind';

interface Props {
  models: string[];
  placements: Placed[];
  /** Apply wind sway to this layer (trees, bushes). Rocks/mushrooms: false. */
  wind?: { strength: number; pivot: number } | false;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Optional per-instance colour tints (multiplied) for varied undergrowth. */
  tints?: string[];
}

/**
 * Loads a set of GLTF variants and places lightweight clones at the given
 * scatter points. Materials/geometry are shared across clones (clone keeps
 * references), so the wind patch on a shared material animates every instance.
 */
export default function ScatterLayer({
  models, placements, wind = false, castShadow = true, receiveShadow = false, tints,
}: Props) {
  const gltfs = useGLTF(models);

  const prepared = useMemo(() => {
    const scenes = (Array.isArray(gltfs) ? gltfs : [gltfs]).map(g => g.scene);
    scenes.forEach(scene => {
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.castShadow = castShadow; m.receiveShadow = receiveShadow; }
      });
      if (wind) applyWindToTree(scene, { strength: wind.strength, pivot: wind.pivot });
    });
    return scenes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltfs]);

  return (
    <group>
      {placements.map((p, i) => {
        const src = prepared[p.modelIndex % prepared.length];
        if (!src) return null;
        const clone = src.clone(true);
        if (tints && tints.length) {
          // tint this instance: clone its materials and multiply by a palette colour
          const tint = new THREE.Color(tints[(p.modelIndex + i * 7) % tints.length]);
          clone.traverse(o => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            const base = Array.isArray(m.material) ? m.material[0] : m.material;
            const mat = (base as THREE.MeshStandardMaterial).clone();
            mat.color = mat.color.clone().lerp(tint, 0.55);
            m.material = mat;
          });
        }
        return (
          <primitive
            key={i}
            object={clone}
            position={p.position}
            rotation={[0, p.rotationY, 0]}
            scale={p.scale}
          />
        );
      })}
    </group>
  );
}

/** Convenience for building scatter placements inline. */
export { scatter };
