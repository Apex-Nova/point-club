import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EFFECTS } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { worldState } from '../state/worldStore';
import { makeRng } from '../utils/placement';

/**
 * Ambient depth: warm volumetric haze (scene fog) plus slow-floating dust motes
 * catching the light. Intensity is driven by the scroll timeline / debug panel.
 */
export default function AtmosphereSystem({ lowPerf = false }: { lowPerf?: boolean }) {
  const soft = useTexture(EFFECTS.powderSoft);
  const fogRef = useRef<THREE.FogExp2>(null);
  const motesRef = useRef<THREE.Points>(null);
  const count = lowPerf ? 80 : 180;

  const geometry = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0x2545f491);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = rng() * WORLD.groundRadius * 0.8;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.5 + rng() * 9;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    const { atmosphereIntensity, scrollProgress } = worldState();
    const intensity = atmosphereIntensity * (0.5 + scrollProgress * 0.7);
    // light, hazy atmospheric perspective — distant forest softens into warm haze
    if (fogRef.current) fogRef.current.density = 0.011 + intensity * 0.012;
    if (motesRef.current) {
      const t = clock.elapsedTime;
      motesRef.current.position.y = Math.sin(t * 0.1) * 0.4;
      motesRef.current.rotation.y = t * 0.01;
      (motesRef.current.material as THREE.PointsMaterial).opacity = 0.22 + intensity * 0.4;
    }
  });

  return (
    <>
      {/* soft warm depth haze (atmospheric perspective for layered forest) */}
      <fogExp2 ref={fogRef} attach="fog" args={['#dfeed6', 0.012]} />
      {/* glowing dust motes drifting in the light */}
      <points ref={motesRef} geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          map={soft}
          size={0.6}
          sizeAttenuation
          transparent
          depthWrite={false}
          color="#fff2cf"
          opacity={0.32}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
