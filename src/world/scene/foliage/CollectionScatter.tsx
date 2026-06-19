import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { scatter, type Placed } from '../../utils/placement';
import { applyWindToTree } from '../../shaders/wind';

interface Props {
  /** Collection GLB URLs; each holds several individual items (trees, etc.). */
  collections: string[];
  placements: Placed[];
  /** Target height (world units) one item maps to; placement.scale multiplies it. */
  targetHeight: number;
  wind?: { strength: number; pivot: number } | false;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Splits Quaternius "collection" GLBs (e.g. pine_trees → PineTree_1..5) into
 * individual, height-normalized items and scatters them. This lets one packed
 * file act like a set of separate models, matching the MegaKit scatter style.
 */
export default function CollectionScatter({
  collections, placements, targetHeight, wind = false, castShadow = true, receiveShadow = false,
}: Props) {
  const gltfs = useGLTF(collections);

  // Build a pool of normalized item prototypes (unit height, base at y=0, centred).
  const pool = useMemo(() => {
    const scenes = (Array.isArray(gltfs) ? gltfs : [gltfs]).map(g => g.scene);
    const items: THREE.Object3D[] = [];
    for (const scene of scenes) {
      // descend through single-child wrappers to the container of the items
      let container: THREE.Object3D = scene;
      while (container.children.length === 1 && !(container.children[0] as THREE.Mesh).isMesh) {
        container = container.children[0];
      }
      for (const child of container.children) {
        const item = child.clone(true);
        item.position.set(0, 0, 0);
        item.rotation.set(0, 0, 0);
        item.scale.set(1, 1, 1);
        item.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(item);
        const size = new THREE.Vector3(); box.getSize(size);
        const center = new THREE.Vector3(); box.getCenter(center);
        const h = size.y || 1;
        // recentre on xz, base to 0
        item.position.set(-center.x, -box.min.y, -center.z);
        item.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.isMesh) { m.castShadow = castShadow; m.receiveShadow = receiveShadow; }
        });
        const wrapper = new THREE.Group();
        wrapper.add(item);
        wrapper.scale.setScalar(1 / h); // normalize to unit height
        if (wind) applyWindToTree(wrapper, { strength: wind.strength, pivot: wind.pivot });
        items.push(wrapper);
      }
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltfs]);

  if (!pool.length) return null;
  return (
    <group>
      {placements.map((p, i) => {
        // spread across the whole extracted pool (which is larger than scatter's
        // model count) so every individual tree/flower variant gets used
        const src = pool[(p.modelIndex + i) % pool.length];
        const clone = src.clone(true);
        return (
          <primitive
            key={i}
            object={clone}
            position={p.position}
            rotation={[0, p.rotationY, 0]}
            scale={p.scale * targetHeight}
          />
        );
      })}
    </group>
  );
}

export { scatter };
