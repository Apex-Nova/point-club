import { useMemo, useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT, EFFECTS, FOLIAGE } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { heightAt } from '../config/terrain';
import { makeRng } from '../utils/placement';

/**
 * The pond + waterfall feature. A stylized animated water disc sits in the
 * terrain basin; the imported low-poly waterfall pours from the raised cliff
 * behind it; soft mist drifts at the base. Fish (see Fauna) swim just beneath
 * the translucent surface.
 */
export default function WaterFeature() {
  const [px, , pz] = WORLD.pond.center;
  const [fx, , fz] = WORLD.waterfall.position;
  const waterY = WORLD.pond.waterY;

  return (
    <group name="WaterFeature">
      <Pond cx={px} cz={pz} y={waterY} radius={WORLD.pond.radius} />
      <Waterfall x={fx} z={fz} y={waterY} />
      <Mist cx={px} cz={pz} y={waterY} />
      <RimRocks cx={px} cz={pz} radius={WORLD.pond.radius} />
    </group>
  );
}

/** Stylized animated water surface — moving ripples, depth gradient, foam rim. */
function Pond({ cx, cz, y, radius }: { cx: number; cz: number; y: number; radius: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color('#1b6f8c') },
        uShallow: { value: new THREE.Color('#5fc9d6') },
        uFoam: { value: new THREE.Color('#eaffff') },
        uRadius: { value: radius },
      },
      vertexShader: /* glsl */ `
        varying vec2 vXz;
        varying float vR;
        uniform float uTime;
        void main() {
          vXz = position.xy;            // CircleGeometry is in XY before rotation
          vR = length(position.xy);
          vec3 p = position;
          float ripple = sin(p.x * 1.4 + uTime * 1.6) * 0.04 + cos(p.y * 1.7 - uTime * 1.3) * 0.04;
          p.z += ripple;                // pre-rotation z = world y
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vXz;
        varying float vR;
        uniform float uTime;
        uniform vec3 uDeep, uShallow, uFoam;
        uniform float uRadius;
        void main() {
          float t = clamp(vR / uRadius, 0.0, 1.0);
          vec3 col = mix(uDeep, uShallow, t * t);
          // drifting glints
          float g = sin(vXz.x * 3.0 + uTime * 2.0) * sin(vXz.y * 3.0 - uTime * 1.5);
          col += smoothstep(0.6, 1.0, g) * 0.25;
          // foam ring near the rim
          float foam = smoothstep(0.82, 0.98, t) * (0.6 + 0.4 * sin(vR * 8.0 - uTime * 3.0));
          col = mix(col, uFoam, clamp(foam, 0.0, 1.0));
          float alpha = mix(0.72, 0.92, t);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, [radius]);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh position={[cx, y, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <circleGeometry args={[radius, 64]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}

/** Imported low-poly waterfall, normalized and seated on the cliff/basin. */
function Waterfall({ x, z, y }: { x: number; z: number; y: number }) {
  const { scene } = useGLTF(ENVIRONMENT.waterfall);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3(); box.getSize(size);
    const target = WORLD.waterfall.scale;
    const s = size.y > 0 ? target / size.y : 1;
    clone.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.y = -box2.min.y; // seat base at 0
    return clone;
  }, [scene]);

  return (
    <group position={[x, y, z]} rotation={[0, WORLD.waterfall.rotationY, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Soft drifting mist at the waterfall base / pond surface. */
function Mist({ cx, cz, y }: { cx: number; cz: number; y: number }) {
  const tex = useTexture(EFFECTS.powderSoft);
  const ref = useRef<THREE.Points>(null);
  const count = 60;

  const geometry = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0x51ed270b);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = rng() * (WORLD.pond.radius + 1);
      pos[i * 3] = cx + Math.cos(a) * r;
      pos[i * 3 + 1] = y + rng() * 1.6;
      pos[i * 3 + 2] = cz + Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [cx, cz, y]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.15;
      (ref.current.material as THREE.PointsMaterial).opacity = 0.18 + Math.sin(clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial map={tex} size={1.8} sizeAttenuation transparent depthWrite={false}
        color="#eafcff" opacity={0.2} blending={THREE.NormalBlending} />
    </points>
  );
}

/** A ring of rocks framing the pond edge (hides the water/terrain seam). */
function RimRocks({ cx, cz, radius }: { cx: number; cz: number; radius: number }) {
  const gltfs = useGLTF(FOLIAGE.rocks);
  const scenes = useMemo(() => (Array.isArray(gltfs) ? gltfs : [gltfs]).map(g => g.scene), [gltfs]);
  const rocks = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0x1234abcd);
    const out: { pos: [number, number, number]; rot: number; scl: number; idx: number }[] = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng() * 0.3;
      const r = radius + 0.3 + rng() * 0.8;
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      out.push({ pos: [x, heightAt(x, z) - 0.1, z], rot: rng() * Math.PI * 2, scl: 0.7 + rng() * 1.1, idx: i % scenes.length });
    }
    return out;
  }, [cx, cz, radius, scenes.length]);

  return (
    <group>
      {rocks.map((r, i) => {
        const src = scenes[r.idx];
        if (!src) return null;
        return <primitive key={i} object={src.clone(true)} position={r.pos} rotation={[0, r.rot, 0]} scale={r.scl} />;
      })}
    </group>
  );
}

useGLTF.preload(ENVIRONMENT.waterfall);
