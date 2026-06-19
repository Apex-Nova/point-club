import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FOLIAGE } from '../../config/assets';
import { applyWind } from '../../shaders/wind';
import { makeRng } from '../../utils/placement';
import { WORLD } from '../../config/worldConfig';
import { heightAt } from '../../config/terrain';

interface Props {
  count: number;
  radius?: number;
  innerHole?: number;
  /** Grass species model (defaults to the common tall tuft). */
  model?: string;
  /** Seed offset so layered species don't sit on identical points. */
  seedOffset?: number;
  /** Optional xz centres to keep clear (e.g. the pond). */
  avoid?: { x: number; z: number; r: number }[];
}

/**
 * Instanced grass — one draw call for thousands of tufts. The wind shader reads
 * each instance's matrix so blades sway independently. Geometry/material come
 * straight from the MegaKit grass tuft.
 */
export default function GrassField({
  count, radius = WORLD.groundRadius, innerHole = WORLD.workshopClearRadius - 2,
  model = FOLIAGE.grass, seedOffset = 0, avoid = [],
}: Props) {
  const { scene } = useGLTF(model);

  const { geometry, material } = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    let mat: THREE.Material | null = null;
    scene.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !geo) {
        geo = m.geometry;
        mat = (Array.isArray(m.material) ? m.material[0] : m.material).clone();
      }
    });
    if (mat) {
      (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      applyWind(mat, { strength: 0.5, pivot: 0.6, frequency: 0.5, instanced: true });
    }
    return { geometry: geo, material: mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  const instanced = useMemo(() => {
    if (!geometry || !material) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    const dummy = new THREE.Object3D();
    const rng = makeRng((WORLD.seed ^ 0x9e3779b9) + seedOffset * 2654435761);
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < count * 20) {
      guard++;
      const r = innerHole + Math.sqrt(rng()) * (radius - innerHole);
      const a = rng() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (avoid.some(cc => Math.hypot(x - cc.x, z - cc.z) < cc.r)) continue;
      dummy.position.set(x, heightAt(x, z), z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      const s = 0.7 + rng() * 0.8;
      dummy.scale.set(s, 0.8 + rng() * 0.6, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [geometry, material, count, radius, innerHole]);

  if (!instanced) return null;
  return <primitive object={instanced} />;
}
