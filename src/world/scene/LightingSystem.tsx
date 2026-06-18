import { Sky, Environment, Lightformer } from '@react-three/drei';

/** Sun direction, shared by the Sky disc and the directional key light.
 *  Lower sun = warmer, more golden horizon. */
const SUN: [number, number, number] = [22, 7, 14];

/**
 * Premium warm lighting: a golden-hour procedural sky + warm key sun with soft
 * shadows, cool sky fill, and a lightweight procedural environment for soft
 * image-based reflections (no external HDRI — avoids asset corruption and keeps
 * the scene reliably bright and inviting).
 */
export default function LightingSystem() {
  return (
    <>
      {/* Procedural golden-hour sky — bright, warm, never dark. */}
      <Sky
        distance={4500}
        sunPosition={SUN}
        turbidity={9}
        rayleigh={1.2}
        mieCoefficient={0.008}
        mieDirectionalG={0.92}
      />

      {/* warm directional key (the sun), casts soft shadows */}
      <directionalLight
        position={SUN}
        intensity={2.6}
        color="#ffe1ac"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
      {/* cool ambient bounce from the sky / warm bounce from the ground */}
      <hemisphereLight args={['#cfe8ff', '#6a572f', 0.85]} />
      {/* gentle fill so shadows never go black */}
      <ambientLight intensity={0.45} color="#fff1d6" />

      {/* Soft procedural IBL for gentle reflections (matters for copper in Phase 2). */}
      <Environment resolution={128}>
        <Lightformer intensity={2} color="#ffe6b8" position={[10, 8, 6]} scale={[12, 12, 1]} />
        <Lightformer intensity={0.8} color="#bcd9ff" position={[-8, 6, -6]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.6} color="#fff" position={[0, -6, 0]} scale={[20, 20, 1]} />
      </Environment>
    </>
  );
}
