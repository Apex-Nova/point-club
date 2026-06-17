import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Environment, Float, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

/* ── Forest palette ──────────────────────────────────────────── */
const FOREST   = '#2f6b3a';
const GRASS    = '#5aa84b';
const GRASS_D  = '#3f8a3a';
const BARK     = '#8a5a36';
const BARK_D   = '#6f4527';
const CREAM    = '#fbf6e9';
const SUN      = '#ffe6a3';
const PETAL    = ['#ff8fab', '#ffd166', '#9b5de5', '#ff7b54', '#ffffff'];
const HOLI     = ['#ff5d8f', '#ffd23f', '#4cc66b', '#48b8ff', '#ff8c42'];

/* ════════════════════════════════════════════════════════════
   Instanced low-poly trees that sway in the wind
   ════════════════════════════════════════════════════════════ */
function Trees({ count = 14 }: { count?: number }) {
  const foliage = useRef<THREE.InstancedMesh>(null);
  const trunks  = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: number; phase: number; tone: number }[] = [];
    for (let i = 0; i < count; i++) {
      // ring them around the back/sides so the robot stays clear in front-center
      const ang = (i / count) * Math.PI * 2;
      const rad = 6 + Math.random() * 7;
      const x = Math.cos(ang) * rad;
      const z = -3 - Math.abs(Math.sin(ang)) * rad * 0.7 - Math.random() * 3;
      arr.push({
        pos: [x, -1.6, z],
        scale: 0.8 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        tone: Math.random(),
      });
    }
    return arr;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (foliage.current && trunks.current) {
      data.forEach((d, i) => {
        const sway = Math.sin(t * 0.8 + d.phase) * 0.05;
        // foliage
        dummy.position.set(d.pos[0], d.pos[1] + 2.4 * d.scale, d.pos[2]);
        dummy.rotation.set(sway, d.phase, sway * 0.6);
        dummy.scale.setScalar(d.scale * (1.4 + Math.sin(t + d.phase) * 0.02));
        dummy.updateMatrix();
        foliage.current!.setMatrixAt(i, dummy.matrix);
        // trunk
        dummy.position.set(d.pos[0], d.pos[1] + 0.9 * d.scale, d.pos[2]);
        dummy.rotation.set(0, 0, sway * 0.4);
        dummy.scale.set(d.scale, d.scale, d.scale);
        dummy.updateMatrix();
        trunks.current!.setMatrixAt(i, dummy.matrix);
      });
      foliage.current.instanceMatrix.needsUpdate = true;
      trunks.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 1.8, 6]} />
        <meshStandardMaterial color={BARK} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={foliage} args={[undefined, undefined, count]} castShadow>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color={FOREST} roughness={0.8} flatShading />
      </instancedMesh>
    </group>
  );
}

/* ════════════════════════════════════════════════════════════
   Instanced grass blades + flowers on the ground
   ════════════════════════════════════════════════════════════ */
function GroundDetail() {
  const grass = useRef<THREE.InstancedMesh>(null);
  const COUNT = 240;

  const blades = useMemo(() => {
    const arr: { x: number; z: number; h: number; phase: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      const r = 2 + Math.random() * 11;
      const a = Math.random() * Math.PI * 2;
      arr.push({
        x: Math.cos(a) * r,
        z: Math.sin(a) * r * 0.6 - 1,
        h: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!grass.current) return;
    blades.forEach((b, i) => {
      dummy.position.set(b.x, -1.6 + b.h / 2, b.z);
      dummy.rotation.set(0, 0, Math.sin(t * 1.6 + b.phase) * 0.25);
      dummy.scale.set(0.06, b.h, 0.06);
      dummy.updateMatrix();
      grass.current!.setMatrixAt(i, dummy.matrix);
    });
    grass.current.instanceMatrix.needsUpdate = true;
  });

  // flowers — small colored discs
  const flowers = useMemo(
    () =>
      Array.from({ length: 26 }, () => {
        const r = 2.5 + Math.random() * 8;
        const a = Math.random() * Math.PI * 2;
        return {
          pos: [Math.cos(a) * r, -1.55, Math.sin(a) * r * 0.6 - 1] as [number, number, number],
          color: PETAL[Math.floor(Math.random() * PETAL.length)],
          s: 0.5 + Math.random() * 0.6,
        };
      }),
    [],
  );

  return (
    <group>
      <instancedMesh ref={grass} args={[undefined, undefined, COUNT]}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={GRASS_D} roughness={1} />
      </instancedMesh>
      {flowers.map((f, i) => (
        <group key={i} position={f.pos} scale={f.s}>
          {[0, 1, 2, 3, 4].map(p => (
            <mesh key={p} rotation={[Math.PI / 2, 0, (p / 5) * Math.PI * 2]} position={[Math.cos((p / 5) * Math.PI * 2) * 0.12, 0, Math.sin((p / 5) * Math.PI * 2) * 0.12]}>
              <circleGeometry args={[0.1, 8]} />
              <meshStandardMaterial color={f.color} side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.06, 8]} />
            <meshStandardMaterial color={SUN} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ════════════════════════════════════════════════════════════
   Butterflies drifting on figure-8 paths
   ════════════════════════════════════════════════════════════ */
function Butterfly({ seed, color }: { seed: number; color: string }) {
  const grp = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seed * 7;
    if (grp.current) {
      grp.current.position.set(
        Math.sin(t * 0.5) * 3.4 + Math.cos(seed) * 2,
        0.6 + Math.sin(t * 0.9) * 0.9,
        Math.cos(t * 0.6) * 2 - 0.5,
      );
      grp.current.rotation.y = Math.atan2(Math.cos(t * 0.5), -Math.sin(t * 0.6)) + Math.PI / 2;
    }
    const flap = Math.sin(t * 18) * 0.9;
    if (wingL.current) wingL.current.rotation.y = flap;
    if (wingR.current) wingR.current.rotation.y = -flap;
  });
  return (
    <group ref={grp} scale={0.5}>
      <mesh ref={wingL} position={[-0.02, 0, 0]}>
        <circleGeometry args={[0.18, 12]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.5} transparent opacity={0.92} />
      </mesh>
      <mesh ref={wingR} position={[0.02, 0, 0]}>
        <circleGeometry args={[0.18, 12]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.5} transparent opacity={0.92} />
      </mesh>
      <mesh>
        <capsuleGeometry args={[0.02, 0.14, 4, 8]} />
        <meshStandardMaterial color={BARK_D} />
      </mesh>
    </group>
  );
}

/* ════════════════════════════════════════════════════════════
   Birds — simple V shapes gliding across the sky
   ════════════════════════════════════════════════════════════ */
function Birds() {
  const grp = useRef<THREE.Group>(null);
  const birds = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({ off: i * 0.6, y: 3 + i * 0.4, z: -6 - i })),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    grp.current?.children.forEach((b, i) => {
      const x = ((t * 1.2 + birds[i].off * 4) % 24) - 12;
      b.position.set(x, birds[i].y + Math.sin(t + i) * 0.2, birds[i].z);
      b.children.forEach((wing, w) => {
        (wing as THREE.Mesh).rotation.z = (w === 0 ? 1 : -1) * (0.3 + Math.sin(t * 6 + i) * 0.4);
      });
    });
  });
  return (
    <group ref={grp}>
      {birds.map((_, i) => (
        <group key={i}>
          {[0, 1].map(w => (
            <mesh key={w} position={[w === 0 ? -0.12 : 0.12, 0, 0]}>
              <boxGeometry args={[0.24, 0.02, 0.06]} />
              <meshStandardMaterial color="#3a4a55" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ════════════════════════════════════════════════════════════
   Floating dust / pollen particles catching the light
   ════════════════════════════════════════════════════════════ */
function Pollen() {
  const ref = useRef<THREE.Points>(null);
  const COUNT = 160;
  const positions = useMemo(() => {
    const p = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16;
      p[i * 3 + 1] = Math.random() * 6 - 1;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    return p;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += 0.003 + Math.sin(t + i) * 0.001;
      arr[i * 3] += Math.sin(t * 0.4 + i) * 0.002;
      if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = -1;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color={SUN} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ════════════════════════════════════════════════════════════
   The friendly artist robot — walks, paints, waves, reacts
   ════════════════════════════════════════════════════════════ */
function Robot({
  pointer, waving, onPoke,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  waving: boolean;
  onPoke: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armWave = useRef<THREE.Group>(null);
  const armPaint = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const antenna = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (root.current) {
      // gentle stroll left-right across the clearing
      root.current.position.x = Math.sin(t * 0.32) * 2.4;
      root.current.position.z = Math.cos(t * 0.32) * 0.6;
      root.current.position.y = -1.0 + Math.abs(Math.sin(t * 2.2)) * 0.08; // walk bob
      root.current.rotation.y = Math.cos(t * 0.32) * 0.4 - 0.1;
      root.current.rotation.z = Math.sin(t * 2.2) * 0.02;
    }
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, pointer.current.x * 0.5, 0.07);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -pointer.current.y * 0.3, 0.07);
    }
    if (armPaint.current) {
      armPaint.current.rotation.x = -0.5 + Math.sin(t * 5) * 0.4;
    }
    if (armWave.current) {
      const target = waving ? 2.3 + Math.sin(t * 14) * 0.4 : 0.35;
      armWave.current.rotation.z = THREE.MathUtils.lerp(armWave.current.rotation.z, target, 0.15);
    }
    const blink = Math.sin(t * 2.6) > 0.94 ? 0.1 : 1;
    if (eyeL.current) eyeL.current.scale.y = THREE.MathUtils.lerp(eyeL.current.scale.y, blink, 0.4);
    if (eyeR.current) eyeR.current.scale.y = THREE.MathUtils.lerp(eyeR.current.scale.y, blink, 0.4);
    if (antenna.current) {
      const m = antenna.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.35;
    }
  });

  return (
    <group
      ref={root}
      scale={hovered ? 0.92 : 0.86}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPoke(); }}
      castShadow
    >
      {/* head */}
      <group ref={head} position={[0, 1.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 1.2, 1.15]} />
          <meshStandardMaterial color={CREAM} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[1.52, 0.26, 1.17]} />
          <meshStandardMaterial color={GRASS} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.02, 0.6]}>
          <boxGeometry args={[1.12, 0.78, 0.08]} />
          <meshStandardMaterial color="#26352a" roughness={0.3} />
        </mesh>
        <mesh ref={eyeL} position={[-0.26, 0.05, 0.66]}>
          <circleGeometry args={[0.15, 24]} />
          <meshStandardMaterial color="#aef0c0" emissive={GRASS} emissiveIntensity={0.6} />
        </mesh>
        <mesh ref={eyeR} position={[0.26, 0.05, 0.66]}>
          <circleGeometry args={[0.15, 24]} />
          <meshStandardMaterial color="#aef0c0" emissive={GRASS} emissiveIntensity={0.6} />
        </mesh>
        {/* cheeks */}
        <mesh position={[-0.4, -0.17, 0.64]}>
          <circleGeometry args={[0.09, 18]} />
          <meshStandardMaterial color="#ff9eb0" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0.4, -0.17, 0.64]}>
          <circleGeometry args={[0.09, 18]} />
          <meshStandardMaterial color="#ff9eb0" transparent opacity={0.85} />
        </mesh>
        {/* smile */}
        <mesh position={[0, -0.2, 0.65]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.2, 0.027, 8, 20, Math.PI]} />
          <meshStandardMaterial color={SUN} emissive={SUN} emissiveIntensity={0.3} />
        </mesh>
        {/* antenna with leaf */}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.36, 6]} />
          <meshStandardMaterial color={BARK} />
        </mesh>
        <mesh ref={antenna} position={[0, 0.98, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={SUN} emissive={SUN} emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* body */}
      <group position={[0, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.35, 1.4, 0.95]} />
          <meshStandardMaterial color={FOREST} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 0.49]}>
          <boxGeometry args={[0.95, 0.95, 0.06]} />
          <meshStandardMaterial color={CREAM} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[1.37, 0.28, 0.97]} />
          <meshStandardMaterial color={BARK} roughness={0.6} />
        </mesh>
        {/* heart */}
        <mesh position={[0, 0.28, 0.54]}>
          <circleGeometry args={[0.18, 20]} />
          <meshStandardMaterial color="#ff6b8a" emissive="#ff6b8a" emissiveIntensity={0.4} />
        </mesh>
        {HOLI.slice(0, 3).map((c, i) => (
          <mesh key={i} position={[(i - 1) * 0.22, -0.16, 0.54]}>
            <circleGeometry args={[0.05, 14]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>

      {/* waving arm */}
      <group ref={armWave} position={[-0.75, 0.72, 0]}>
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.12, 0.5, 6, 12]} />
          <meshStandardMaterial color={GRASS} roughness={0.5} />
        </mesh>
        <mesh position={[-0.62, 0, 0]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color={CREAM} roughness={0.5} />
        </mesh>
      </group>

      {/* painting arm with brush */}
      <group ref={armPaint} position={[0.75, 0.72, 0.1]}>
        <mesh position={[0.3, -0.1, 0]} rotation={[0, 0, -Math.PI / 2.6]}>
          <capsuleGeometry args={[0.12, 0.5, 6, 12]} />
          <meshStandardMaterial color={GRASS} roughness={0.5} />
        </mesh>
        <mesh position={[0.56, -0.42, 0.14]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color={CREAM} roughness={0.5} />
        </mesh>
        <mesh position={[0.74, -0.62, 0.32]} rotation={[0.6, 0, -0.5]}>
          <cylinderGeometry args={[0.035, 0.035, 0.7, 6]} />
          <meshStandardMaterial color={BARK} />
        </mesh>
        <mesh position={[0.92, -0.88, 0.5]} rotation={[0.6, 0, -0.5]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
          <meshStandardMaterial color="#ff6b8a" />
        </mesh>
      </group>

      {/* wheel feet */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={i} position={[x, -0.55, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={BARK_D} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Easel the robot paints on ───────────────────────────────── */
function Easel({ strokes }: { strokes: { x: number; y: number; c: string; r: number }[] }) {
  return (
    <group position={[3.4, -1.0, -0.3]} rotation={[0, -0.5, 0]} scale={0.9}>
      <mesh castShadow>
        <boxGeometry args={[1.7, 1.9, 0.08]} />
        <meshStandardMaterial color={CREAM} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[1.92, 2.12, 0.07]} />
        <meshStandardMaterial color={BARK} roughness={0.7} />
      </mesh>
      {strokes.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0.05]}>
          <circleGeometry args={[s.r, 14]} />
          <meshStandardMaterial color={s.c} />
        </mesh>
      ))}
      <mesh position={[-0.66, -1.55, -0.1]} rotation={[0, 0, 0.13]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
        <meshStandardMaterial color={BARK_D} roughness={0.8} />
      </mesh>
      <mesh position={[0.66, -1.55, -0.1]} rotation={[0, 0, -0.13]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
        <meshStandardMaterial color={BARK_D} roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ── Holi powder burst on poke ───────────────────────────────── */
function PowderBurst({ trigger }: { trigger: number }) {
  const COUNT = 600;
  const ref = useRef<THREE.Points>(null);
  const state = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const life = new Float32Array(COUNT);
    const maxLife = new Float32Array(COUNT);
    const c = new THREE.Color();
    const seed = (i: number) => {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      const ang = Math.random() * Math.PI * 2;
      const sp = 0.5 + Math.random() * 2;
      vel[i * 3] = Math.cos(ang) * sp;
      vel[i * 3 + 1] = Math.random() * 1.5 + 0.5;
      vel[i * 3 + 2] = Math.sin(ang) * sp;
      c.set(HOLI[Math.floor(Math.random() * HOLI.length)]);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      maxLife[i] = 1.4 + Math.random() * 1.8;
      life[i] = Math.random() * maxLife[i];
    };
    for (let i = 0; i < COUNT; i++) seed(i);
    return { positions, colors, vel, life, maxLife, seed };
  }, []);
  const last = useRef(trigger);
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const { positions, vel, life, maxLife, seed } = state;
    if (trigger !== last.current) {
      last.current = trigger;
      for (let i = 0; i < COUNT; i++) { life[i] = 0; seed(i); }
    }
    for (let i = 0; i < COUNT; i++) {
      life[i] += d;
      if (life[i] > maxLife[i]) { life[i] = 0; seed(i); }
      positions[i * 3] += vel[i * 3] * d;
      positions[i * 3 + 1] += vel[i * 3 + 1] * d;
      positions[i * 3 + 2] += vel[i * 3 + 2] * d;
      vel[i * 3 + 1] -= 0.9 * d;
      vel[i * 3] *= 0.985; vel[i * 3 + 2] *= 0.985;
    }
    if (ref.current) {
      (ref.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  });
  return (
    <points ref={ref} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={state.positions} count={COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={state.colors} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.13} vertexColors transparent opacity={0.8} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ── Ground plane ────────────────────────────────────────────── */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, -1]} receiveShadow>
      <circleGeometry args={[18, 48]} />
      <meshStandardMaterial color={GRASS} roughness={1} />
    </mesh>
  );
}

/* ════════════════════════════════════════════════════════════
   Scene assembly
   ════════════════════════════════════════════════════════════ */
function SceneContent() {
  const pointer = useRef({ x: 0, y: 0 });
  const [waving, setWaving] = useState(false);
  const [burst, setBurst] = useState(0);
  const [strokes, setStrokes] = useState<{ x: number; y: number; c: string; r: number }[]>([]);
  const tick = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (t - tick.current > 0.9 && strokes.length < 18) {
      tick.current = t;
      setStrokes(s => [...s, {
        x: (Math.random() - 0.5) * 1.2,
        y: (Math.random() - 0.5) * 1.4,
        c: HOLI[Math.floor(Math.random() * HOLI.length)],
        r: 0.08 + Math.random() * 0.07,
      }]);
    }
  });

  const poke = () => {
    setWaving(true);
    setStrokes([]);
    setBurst(b => b + 1);
    setTimeout(() => setWaving(false), 1700);
  };

  return (
    <group
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        pointer.current.x = e.point.x / 7;
        pointer.current.y = e.point.y / 5;
      }}
    >
      {/* invisible catcher so pointer move works across the scene */}
      <mesh position={[0, 0, -1]} visible={false}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial />
      </mesh>

      {/* warm forest lighting */}
      <ambientLight intensity={0.85} color="#fff6e0" />
      <hemisphereLight args={['#bfe9ff', '#4a7a3a', 0.6]} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={1.5}
        color={SUN}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <fog attach="fog" args={['#dff3e4', 14, 30]} />

      <Ground />
      <Trees />
      <GroundDetail />
      <Birds />
      <Pollen />
      {HOLI.map((c, i) => (
        <Butterfly key={i} seed={i / HOLI.length} color={c} />
      ))}

      {/* Holi powder only bursts when the robot is poked — keeps the hero text readable */}
      {burst > 0 && (
        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
          <PowderBurst trigger={burst} />
        </Float>
      )}

      <Robot pointer={pointer} waving={waving} onPoke={poke} />
      <Easel strokes={strokes} />
    </group>
  );
}

export default function ForestScene() {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: [0, 1.2, 11], fov: 48 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <AdaptiveDpr pixelated />
      <Suspense fallback={null}>
        <SceneContent />
        <Environment preset="park" />
      </Suspense>
    </Canvas>
  );
}
