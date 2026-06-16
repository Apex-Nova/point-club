import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

const HOLI = ['#f72585', '#7209b7', '#3a86ff', '#06d6a0', '#ffbe0b', '#fb5607'];

/* ─── Cute painting robot ─────────────────────────────────── */
function Robot({
  pointer,
  waving,
  onPoke,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  waving: boolean;
  onPoke: () => void;
}) {
  const root    = useRef<THREE.Group>(null);
  const head     = useRef<THREE.Group>(null);
  const armR     = useRef<THREE.Group>(null);   // painting arm
  const armL     = useRef<THREE.Group>(null);   // waving arm
  const lid      = useRef<THREE.Mesh>(null);    // eye blink scale
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // gentle body bob + lean toward pointer
    if (root.current) {
      root.current.position.y = Math.sin(t * 1.2) * 0.06 - 0.2;
      root.current.rotation.z = Math.sin(t * 0.8) * 0.02;
    }

    // head follows the cursor
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, pointer.current.x * 0.5, 0.08);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -pointer.current.y * 0.3, 0.08);
    }

    // painting arm — quick dabbing motion
    if (armR.current) {
      armR.current.rotation.x = -0.6 + Math.sin(t * 6) * 0.45;
      armR.current.rotation.z = -0.5 + Math.cos(t * 6) * 0.12;
    }

    // left arm — wave when poked, else rest
    if (armL.current) {
      const target = waving
        ? 2.2 + Math.sin(t * 14) * 0.4
        : 0.35;
      armL.current.rotation.z = THREE.MathUtils.lerp(armL.current.rotation.z, target, 0.15);
    }

    // blink
    if (lid.current) {
      const blink = (Math.sin(t * 2.5) > 0.96) ? 0.1 : 1;
      lid.current.scale.y = THREE.MathUtils.lerp(lid.current.scale.y, blink, 0.4);
    }
  });

  const bodyColor = hovered ? '#9ad6ff' : '#cfe8ff';

  return (
    <group
      ref={root}
      scale={hovered ? 1.05 : 1}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPoke(); }}
    >
      {/* ── Head ── */}
      <group ref={head} position={[0, 1.45, 0]}>
        {/* head box */}
        <mesh>
          <boxGeometry args={[1.5, 1.2, 1.2]} />
          <meshStandardMaterial color={bodyColor} roughness={0.35} metalness={0.2} />
        </mesh>
        {/* face screen */}
        <mesh position={[0, 0, 0.62]}>
          <boxGeometry args={[1.1, 0.8, 0.06]} />
          <meshStandardMaterial color="#16242e" roughness={0.2} />
        </mesh>
        {/* eyes */}
        <mesh ref={lid} position={[-0.26, 0.05, 0.68]}>
          <circleGeometry args={[0.14, 24]} />
          <meshStandardMaterial color="#5ef2c0" emissive="#3fd9a8" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.26, 0.05, 0.68]} scale={[1, 1, 1]}>
          <circleGeometry args={[0.14, 24]} />
          <meshStandardMaterial color="#5ef2c0" emissive="#3fd9a8" emissiveIntensity={0.6} />
        </mesh>
        {/* smile */}
        <mesh position={[0, -0.22, 0.67]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.18, 0.025, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#5ef2c0" emissive="#3fd9a8" emissiveIntensity={0.4} />
        </mesh>
        {/* antenna */}
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
          <meshStandardMaterial color="#8a8a8a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#f72585" emissive="#f72585" emissiveIntensity={0.7} />
        </mesh>
        {/* ears */}
        {[-0.82, 0.82].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.16, 12]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ffbe0b" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ── Body ── */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.35, 1.4, 1.0]} />
        <meshStandardMaterial color={bodyColor} roughness={0.35} metalness={0.2} />
      </mesh>
      {/* belly screen / heart */}
      <mesh position={[0, 0.45, 0.52]}>
        <circleGeometry args={[0.28, 24]} />
        <meshStandardMaterial color="#16242e" />
      </mesh>
      <mesh position={[0, 0.45, 0.55]}>
        <circleGeometry args={[0.13, 24]} />
        <meshStandardMaterial color="#06d6a0" emissive="#06d6a0" emissiveIntensity={0.5} />
      </mesh>

      {/* ── Left arm (waving) ── */}
      <group ref={armL} position={[-0.78, 0.7, 0]}>
        <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.13, 0.5, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[-0.62, 0, 0]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color="#ffbe0b" roughness={0.4} />
        </mesh>
      </group>

      {/* ── Right arm (painting, holds brush) ── */}
      <group ref={armR} position={[0.78, 0.7, 0.1]}>
        <mesh position={[0.28, -0.1, 0]} rotation={[0, 0, -Math.PI / 2.6]}>
          <capsuleGeometry args={[0.13, 0.5, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.2} />
        </mesh>
        {/* hand */}
        <mesh position={[0.55, -0.42, 0.15]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#ffbe0b" roughness={0.4} />
        </mesh>
        {/* brush handle */}
        <mesh position={[0.72, -0.62, 0.32]} rotation={[0.6, 0, -0.5]}>
          <cylinderGeometry args={[0.035, 0.035, 0.7, 8]} />
          <meshStandardMaterial color="#7209b7" roughness={0.6} />
        </mesh>
        {/* brush tip */}
        <mesh position={[0.88, -0.86, 0.5]} rotation={[0.6, 0, -0.5]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
          <meshStandardMaterial color="#f72585" roughness={0.7} />
        </mesh>
      </group>

      {/* ── Legs / wheels ── */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={i} position={[x, -0.55, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#8a8a8a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Easel + canvas the robot paints on ──────────────────── */
function Easel({ strokes }: { strokes: { x: number; y: number; c: string }[] }) {
  return (
    <group position={[2.4, -0.1, -0.2]} rotation={[0, -0.4, 0]}>
      {/* canvas board */}
      <mesh>
        <boxGeometry args={[1.8, 2.0, 0.08]} />
        <meshStandardMaterial color="#fffdf7" roughness={0.6} />
      </mesh>
      {/* frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.0, 2.2, 0.06]} />
        <meshStandardMaterial color="#c4956a" roughness={0.7} />
      </mesh>
      {/* painted dabs */}
      {strokes.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0.05]}>
          <circleGeometry args={[0.1, 16]} />
          <meshStandardMaterial color={s.c} />
        </mesh>
      ))}
      {/* easel legs */}
      <mesh position={[-0.7, -1.6, -0.1]} rotation={[0, 0, 0.12]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />
        <meshStandardMaterial color="#a87a4a" roughness={0.8} />
      </mesh>
      <mesh position={[0.7, -1.6, -0.1]} rotation={[0, 0, -0.12]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />
        <meshStandardMaterial color="#a87a4a" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ─── Floating confetti ───────────────────────────────────── */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: (Math.random() - 0.5) * 10,
        y0: Math.random() * 9 - 1,
        z: (Math.random() - 0.5) * 5 - 1,
        speed: 0.2 + Math.random() * 0.3,
        rot: (Math.random() - 0.5) * 3,
        color: HOLI[i % HOLI.length],
        w: 0.06 + Math.random() * 0.04,
      })),
    [],
  );
  return (
    <>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} />
      ))}
    </>
  );
}
function ConfettiPiece({ x, y0, z, speed, rot, color, w }: {
  x: number; y0: number; z: number; speed: number; rot: number; color: string; w: number;
}) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!m.current) return;
    const t = clock.getElapsedTime();
    m.current.position.y = y0 - ((t * speed) % 11);
    m.current.rotation.x = t * rot;
    m.current.rotation.z = t * rot * 0.6;
  });
  return (
    <mesh ref={m} position={[x, y0, z]}>
      <boxGeometry args={[w, w * 0.5, 0.008]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── Scene wrapper ───────────────────────────────────────── */
function SceneContent() {
  const pointer = useRef({ x: 0, y: 0 });
  const [waving, setWaving] = useState(false);
  const [strokes, setStrokes] = useState<{ x: number; y: number; c: string }[]>([]);
  const tick = useRef(0);

  // robot gradually paints dabs onto the easel
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (t - tick.current > 0.9 && strokes.length < 22) {
      tick.current = t;
      setStrokes(s => [
        ...s,
        {
          x: (Math.random() - 0.5) * 1.3,
          y: (Math.random() - 0.5) * 1.5,
          c: HOLI[Math.floor(Math.random() * HOLI.length)],
        },
      ]);
    }
  });

  const poke = () => {
    setWaving(true);
    setStrokes([]);                  // robot wipes the canvas and starts over
    setTimeout(() => setWaving(false), 1600);
  };

  return (
    <group
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        pointer.current.x = (e.point.x) / 6;
        pointer.current.y = (e.point.y) / 4;
      }}
    >
      {/* invisible plane to catch pointer moves */}
      <mesh position={[0, 0, -2]} visible={false}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial />
      </mesh>

      <ambientLight intensity={0.9} color="#ffffff" />
      <directionalLight position={[4, 8, 6]} intensity={1.2} color="#fff6e8" />
      <directionalLight position={[-5, 2, -3]} intensity={0.3} color="#cfe8ff" />
      <pointLight position={[0, 1, 3]} intensity={0.5} color="#06d6a0" distance={10} />

      <Robot pointer={pointer} waving={waving} onPoke={poke} />
      <Easel strokes={strokes} />
      <Confetti />
    </group>
  );
}

/* ─── Exported canvas ─────────────────────────────────────── */
export default function DrawScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.8, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
}
