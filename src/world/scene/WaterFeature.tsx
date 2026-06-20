import { useMemo, useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVIRONMENT, EFFECTS, FOLIAGE } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { heightAt } from '../config/terrain';
import { makeRng } from '../utils/placement';

/**
 * The pond + waterfall focal point, set far behind the platform. A stylized
 * cliff pours an animated water sheet into a rippling pond; foam, mist, splash
 * and bubble particles sell the impact. Tuned to enhance the scene, never to
 * steal attention from the golem. All particle buffers are allocated once and
 * recycled in place (no per-frame allocation).
 */
export default function WaterFeature() {
  const [px, , pz] = WORLD.pond.center;
  const [fx, , fz] = WORLD.waterfall.position;
  const waterY = WORLD.pond.waterY;
  // Falls land at the back of the pond, just in front of the cliff.
  const impact = useMemo(() => new THREE.Vector3(fx, waterY, fz + 2.6), [fx, fz, waterY]);

  return (
    <group name="WaterFeature">
      <Cliff x={fx} z={fz} y={waterY} />
      <FallingWater x={fx} y={waterY} z={fz + 2.4} topY={4.6} />
      <Pond cx={px} cz={pz} y={waterY} radius={WORLD.pond.radius} />
      <ImpactFoam at={impact} />
      <Splash at={impact} />
      <Bubbles cx={px} cz={pz} y={waterY} radius={WORLD.pond.radius} />
      <Mist cx={impact.x} cz={impact.z} y={waterY} />
      <ShoreStones cx={px} cz={pz} radius={WORLD.pond.radius} />
    </group>
  );
}

/** Imported low-poly rock cliff the water pours from. */
function Cliff({ x, z, y }: { x: number; z: number; y: number }) {
  const { scene } = useGLTF(ENVIRONMENT.waterfall);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3(); box.getSize(size);
    const s = size.y > 0 ? WORLD.waterfall.scale / size.y : 1;
    clone.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.y = -box2.min.y;
    return clone;
  }, [scene]);
  return (
    <group position={[x, y, z]} rotation={[0, WORLD.waterfall.rotationY, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Animated falling-water sheet — flowing scroll, foam at top/bottom, soft edges. */
function FallingWater({ x, y, z, topY }: { x: number; y: number; z: number; topY: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const height = topY - y;
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uWater: { value: new THREE.Color('#bfeaff') },
      uFoam: { value: new THREE.Color('#ffffff') },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */`
      varying vec2 vUv; uniform float uTime; uniform vec3 uWater, uFoam;
      float hash(float n){ return fract(sin(n)*43758.5453); }
      void main(){
        // vertical flow streaks scrolling downward
        float flow = vUv.y * 6.0 + uTime * 2.2;
        float streak = 0.5 + 0.5 * sin(vUv.x * 26.0 + sin(flow) * 1.5);
        float fall = fract(flow * 0.5);
        vec3 col = mix(uWater, uFoam, smoothstep(0.55, 1.0, streak));
        // foam burst at top (lip) and bottom (impact)
        col = mix(col, uFoam, smoothstep(0.86, 1.0, vUv.y));
        col = mix(col, uFoam, smoothstep(0.18, 0.0, vUv.y) * (0.6 + 0.4*sin(uTime*8.0+vUv.x*20.0)));
        // soft side edges + subtle vertical droplets
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        float alpha = edge * (0.82 + 0.18*sin(fall*6.28));
        gl_FragColor = vec4(col, alpha);
      }
    `,
  }), []);

  useFrame(({ clock }) => { if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh position={[x, (y + topY) / 2, z]} rotation={[0.12, 0, 0]} renderOrder={3}>
      <planeGeometry args={[2.6, height, 1, 1]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}

/** Stylized animated pond surface — ripples, depth gradient, foam rim. */
function Pond({ cx, cz, y, radius }: { cx: number; cz: number; y: number; radius: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#1b6f8c') },
      uShallow: { value: new THREE.Color('#5fc9d6') },
      uFoam: { value: new THREE.Color('#eaffff') },
      uRadius: { value: radius },
    },
    vertexShader: /* glsl */`
      varying vec2 vXz; varying float vR; uniform float uTime;
      void main(){
        vXz = position.xy; vR = length(position.xy);
        vec3 p = position;
        p.z += sin(p.x*1.4 + uTime*1.6)*0.04 + cos(p.y*1.7 - uTime*1.3)*0.04;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec2 vXz; varying float vR; uniform float uTime;
      uniform vec3 uDeep, uShallow, uFoam; uniform float uRadius;
      void main(){
        float t = clamp(vR/uRadius, 0.0, 1.0);
        vec3 col = mix(uDeep, uShallow, t*t);
        float g = sin(vXz.x*3.0 + uTime*2.0) * sin(vXz.y*3.0 - uTime*1.5);
        col += smoothstep(0.6,1.0,g)*0.22;
        float foam = smoothstep(0.84,0.99,t) * (0.6 + 0.4*sin(vR*8.0 - uTime*3.0));
        col = mix(col, uFoam, clamp(foam,0.0,1.0));
        gl_FragColor = vec4(col, mix(0.74,0.92,t));
      }
    `,
  }), [radius]);

  useFrame(({ clock }) => { if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh position={[cx, y, cz]} rotation={[-Math.PI/2, 0, 0]} renderOrder={2}>
      <circleGeometry args={[radius, 64]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}

/** A bright pulsing foam patch where the falls strike the pond. */
function ImpactFoam({ at }: { at: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current; if (!m) return;
    const s = 1.0 + Math.sin(clock.elapsedTime * 4) * 0.12;
    m.scale.set(s, s, s);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(clock.elapsedTime * 6) * 0.1;
  });
  return (
    <mesh ref={ref} position={[at.x, at.y + 0.02, at.z]} rotation={[-Math.PI/2, 0, 0]} renderOrder={3}>
      <circleGeometry args={[1.4, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/** Upward splash droplets at the impact point — recycled in place. */
function Splash({ at }: { at: THREE.Vector3 }) {
  const tex = useTexture(EFFECTS.powderSoft);
  const ref = useRef<THREE.Points>(null);
  const N = 50;
  const data = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0x5ada);
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 2);  // vy, spread
    const life = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      life[i] = rng();
      vel[i*2] = 1.2 + rng() * 1.6;
      vel[i*2+1] = (rng() - 0.5) * 1.4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { g, pos, vel, life, rng };
  }, []);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    const { pos, vel, life } = data;
    for (let i = 0; i < N; i++) {
      life[i] += dt * 0.9;
      if (life[i] > 1) life[i] -= 1;
      const t = life[i];
      const vy = vel[i*2], spread = vel[i*2+1];
      pos[i*3]   = at.x + spread * t * 1.2;
      pos[i*3+1] = at.y + vy * t - 2.4 * t * t;     // ballistic arc
      pos[i*3+2] = at.z + Math.cos(i) * spread * t;
    }
    data.g.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={data.g} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.5} sizeAttenuation transparent depthWrite={false}
        color="#eafcff" opacity={0.85} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Small bubbles drifting up through the pond surface. */
function Bubbles({ cx, cz, y, radius }: { cx: number; cz: number; y: number; radius: number }) {
  const tex = useTexture(EFFECTS.powderSoft);
  const ref = useRef<THREE.Points>(null);
  const N = 28;
  const data = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0xb0bb1e);
    const pos = new Float32Array(N * 3);
    const base = new Float32Array(N * 2);
    const life = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = rng() * Math.PI * 2, r = rng() * radius * 0.85;
      base[i*2] = cx + Math.cos(a) * r;
      base[i*2+1] = cz + Math.sin(a) * r;
      life[i] = rng();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { g, pos, base, life };
  }, [cx, cz, radius]);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);
    const { pos, base, life } = data;
    for (let i = 0; i < N; i++) {
      life[i] += dt * 0.4;
      if (life[i] > 1) life[i] -= 1;
      pos[i*3]   = base[i*2];
      pos[i*3+1] = y - 0.4 + life[i] * 0.5;
      pos[i*3+2] = base[i*2+1];
    }
    data.g.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={data.g} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.18} sizeAttenuation transparent depthWrite={false}
        color="#ffffff" opacity={0.5} blending={THREE.NormalBlending} />
    </points>
  );
}

/** Soft drifting mist at the waterfall base. */
function Mist({ cx, cz, y }: { cx: number; cz: number; y: number }) {
  const tex = useTexture(EFFECTS.powderSoft);
  const ref = useRef<THREE.Points>(null);
  const N = 50;
  const geometry = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0x51ed270b);
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = rng() * Math.PI * 2, r = rng() * 3;
      pos[i*3] = cx + Math.cos(a) * r;
      pos[i*3+1] = y + rng() * 2.0;
      pos[i*3+2] = cz + Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [cx, cz, y]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.15;
      (ref.current.material as THREE.PointsMaterial).opacity = 0.16 + Math.sin(clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial map={tex} size={2.2} sizeAttenuation transparent depthWrite={false}
        color="#eafcff" opacity={0.18} blending={THREE.NormalBlending} />
    </points>
  );
}

/** Shoreline stones + pebbles blending the pond edge into the grass. */
function ShoreStones({ cx, cz, radius }: { cx: number; cz: number; radius: number }) {
  const rocks = useGLTF(FOLIAGE.rocks);
  const pebbles = useGLTF(FOLIAGE.pebbles);
  const rockScenes = useMemo(() => (Array.isArray(rocks) ? rocks : [rocks]).map(g => g.scene), [rocks]);
  const pebScenes = useMemo(() => (Array.isArray(pebbles) ? pebbles : [pebbles]).map(g => g.scene), [pebbles]);

  const items = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0x1234abcd);
    const out: { pos: [number, number, number]; rot: number; scl: number; peb: boolean; idx: number }[] = [];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng() * 0.35;
      const peb = rng() < 0.55;
      const r = radius + (peb ? 0.1 : 0.4) + rng() * 0.7;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      out.push({
        pos: [x, heightAt(x, z) - 0.08, z], rot: rng() * Math.PI * 2,
        scl: peb ? 0.5 + rng() * 0.6 : 0.6 + rng() * 1.0, peb,
        idx: Math.floor(rng() * 10),
      });
    }
    return out;
  }, [cx, cz, radius]);

  return (
    <group>
      {items.map((it, i) => {
        const pool = it.peb ? pebScenes : rockScenes;
        const src = pool[it.idx % pool.length];
        if (!src) return null;
        return <primitive key={i} object={src.clone(true)} position={it.pos} rotation={[0, it.rot, 0]} scale={it.scl} />;
      })}
    </group>
  );
}

useGLTF.preload(ENVIRONMENT.waterfall);
