import * as THREE from 'three';

/**
 * Shader-based wind. We inject vertex displacement into standard materials via
 * onBeforeCompile so imported GLTF foliage sways organically — no per-object
 * rotation animation. Sway scales with the vertex's height above its origin so
 * trunks stay planted while canopies/blades move most.
 *
 * All patched materials share one uniform object, so a single per-frame update
 * drives the entire forest.
 */

export const windUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1.0 }, // global strength multiplier (driven by worldStore)
};

interface WindOpts {
  /** How much this layer bends. Grass > leaves > branches. */
  strength?: number;
  /** Height (object space) at which sway reaches full strength. */
  pivot?: number;
  /** Spatial frequency of the gust noise. */
  frequency?: number;
  /** Set for InstancedMesh materials so per-instance origin is used. */
  instanced?: boolean;
}

const patched = new WeakSet<THREE.Material>();

/** Patch a single material in place. Idempotent. */
export function applyWind(material: THREE.Material, opts: WindOpts = {}) {
  if (patched.has(material)) return;
  patched.add(material);

  const strength = opts.strength ?? 0.18;
  const pivot = opts.pivot ?? 2.0;
  const frequency = opts.frequency ?? 0.35;
  // InstancedMesh instances are positioned by instanceMatrix, not modelMatrix.
  const originExpr = opts.instanced
    ? '(modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz'
    : 'modelMatrix[3].xyz';

  material.onBeforeCompile = shader => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWind = windUniforms.uWind;
    shader.uniforms.uWindStrength = { value: strength };
    shader.uniforms.uWindPivot = { value: pivot };
    shader.uniforms.uWindFreq = { value: frequency };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform float uWind;
        uniform float uWindStrength;
        uniform float uWindPivot;
        uniform float uWindFreq;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          // world position of the instance/object origin
          vec3 worldOrigin = ${originExpr};
          // multi-octave gust so motion is non-repetitive
          float t = uTime;
          float gust =
              sin(t * 1.3 + worldOrigin.x * uWindFreq) * 0.6
            + sin(t * 2.1 + worldOrigin.z * uWindFreq * 1.7) * 0.3
            + sin(t * 0.7 + (worldOrigin.x + worldOrigin.z) * uWindFreq * 0.5) * 0.4;
          // taller vertices move more; clamp keeps roots still
          float h = clamp(transformed.y / uWindPivot, 0.0, 1.0);
          float bend = gust * uWindStrength * uWind * h;
          transformed.x += bend;
          transformed.z += bend * 0.6;
          // subtle vertical flutter on leaves/blades
          transformed.y += sin(t * 3.0 + worldOrigin.z) * 0.02 * uWindStrength * uWind * h;
        }`,
      );
  };
  material.needsUpdate = true;
}

/** Walk an object tree and apply wind to every mesh material. */
export function applyWindToTree(root: THREE.Object3D, opts: WindOpts = {}) {
  root.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach(m => m && applyWind(m, opts));
  });
}
