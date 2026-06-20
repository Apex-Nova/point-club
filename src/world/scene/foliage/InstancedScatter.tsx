import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Placed } from '../../utils/placement';
import { applyWind } from '../../shaders/wind';

interface Props {
  models: string[];
  placements: Placed[];
  wind?: { strength: number; pivot: number } | false;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * GPU-instanced scatter. For each model it bakes every sub-mesh into one
 * InstancedMesh, so a layer of hundreds of trees/plants costs only a handful of
 * draw calls instead of one-per-object. This is the main performance lever and
 * also makes dense vegetation read as a continuous mass rather than countable
 * individual clones.
 */
export default function InstancedScatter({
  models, placements, wind = false, castShadow = false, receiveShadow = false,
}: Props) {
  const gltfs = useGLTF(models);

  // Per model: its sub-meshes (shared geometry, cloned+wind-patched material,
  // and the mesh's transform relative to the model root).
  const parts = useMemo(() => {
    const scenes = (Array.isArray(gltfs) ? gltfs : [gltfs]).map(g => g.scene);
    return scenes.map(scene => {
      scene.updateMatrixWorld(true);
      const out: { geometry: THREE.BufferGeometry; material: THREE.Material; matrix: THREE.Matrix4 }[] = [];
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const base = Array.isArray(m.material) ? m.material[0] : m.material;
        const material = (base as THREE.Material).clone();
        if (wind) applyWind(material, { strength: wind.strength, pivot: wind.pivot, instanced: true });
        out.push({ geometry: m.geometry, material, matrix: m.matrixWorld.clone() });
      });
      return out;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltfs]);

  const meshes = useMemo(() => {
    if (!parts.length) return [];
    const byModel: Placed[][] = parts.map(() => []);
    for (const p of placements) byModel[p.modelIndex % parts.length].push(p);

    const result: THREE.InstancedMesh[] = [];
    const mPlacement = new THREE.Matrix4();
    const mInstance = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();

    parts.forEach((modelParts, mi) => {
      const ps = byModel[mi];
      if (!ps.length) return;
      for (const part of modelParts) {
        const inst = new THREE.InstancedMesh(part.geometry, part.material, ps.length);
        inst.castShadow = castShadow;
        inst.receiveShadow = receiveShadow;
        ps.forEach((p, j) => {
          pos.set(p.position[0], p.position[1], p.position[2]);
          e.set(0, p.rotationY, 0); q.setFromEuler(e);
          scl.setScalar(p.scale);
          mPlacement.compose(pos, q, scl);
          mInstance.multiplyMatrices(mPlacement, part.matrix);
          inst.setMatrixAt(j, mInstance);
        });
        inst.instanceMatrix.needsUpdate = true;
        inst.computeBoundingSphere(); // correct bounds so frustum culling works
        result.push(inst);
      }
    });
    return result;
  }, [parts, placements, castShadow, receiveShadow]);

  return <group>{meshes.map((m, i) => <primitive key={i} object={m} />)}</group>;
}
