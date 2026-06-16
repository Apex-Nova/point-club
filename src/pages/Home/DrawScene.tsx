import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

/* warm playful palette (from the toy-store template) */
const CORAL  = '#e8765a';
const CORAL2 = '#f2997e';
const TEAL   = '#54b3a4';
const TEAL2  = '#7fcabd';
const MUST   = '#f0b94a';
const MUST2  = '#f7cd77';
const CREAM  = '#fbe9d6';
const BROWN  = '#4a3528';
const PINK   = '#f2a9b8';
const SAGE   = '#9bc3a0';

const HOLI = [CORAL, TEAL, MUST, PINK, '#7aa6d6', '#c98bc4'];

/* ─── Cute, colorful painting robot ───────────────────────── */
function Robot({
  pointer, waving, onPoke,
}: {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  waving: boolean;
  onPoke: () => void;
}) {
  const root  = useRef<THREE.Group>(null);
  const head  = useRef<THREE.Group>(null);
  const armR  = useRef<THREE.Group>(null);
  const armL  = useRef<THREE.Group>(null);
  const eyeL  = useRef<THREE.Mesh>(null);
  const eyeR  = useRef<THREE.Mesh>(null);
  const antenna = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (root.current) {
      root.current.position.y = Math.sin(t * 1.2) * 0.06 - 0.2;
      root.current.rotation.z = Math.sin(t * 0.8) * 0.02;
    }
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, pointer.current.x * 0.55, 0.08);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -pointer.current.y * 0.32, 0.08);
    }
    if (armR.current) {
      armR.current.rotation.x = -0.55 + Math.sin(t * 6) * 0.45;
      armR.current.rotation.z = -0.5 + Math.cos(t * 6) * 0.12;
    }
    if (armL.current) {
      const target = waving ? 2.2 + Math.sin(t * 14) * 0.4 : 0.4;
      armL.current.rotation.z = THREE.MathUtils.lerp(armL.current.rotation.z, target, 0.15);
    }
    // blink both eyes
    const blink = (Math.sin(t * 2.4) > 0.95) ? 0.12 : 1;
    if (eyeL.current) eyeL.current.scale.y = THREE.MathUtils.lerp(eyeL.current.scale.y, blink, 0.4);
    if (eyeR.current) eyeR.current.scale.y = THREE.MathUtils.lerp(eyeR.current.scale.y, blink, 0.4);
    // antenna glow pulse
    if (antenna.current) {
      const mat = antenna.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.35;
    }
  });

  const headColor = hovered ? CORAL : CORAL2;

  return (
    <group
      ref={root}
      scale={hovered ? 1.06 : 1}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onPoke(); }}
    >
      {/* ════ HEAD ════ */}
      <group ref={head} position={[0, 1.5, 0]}>
        {/* head shell */}
        <mesh>
          <boxGeometry args={[1.55, 1.25, 1.2]} />
          <meshStandardMaterial color={headColor} roughness={0.4} metalness={0.1} />
        </mesh>
        {/* top stripe */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.57, 0.28, 1.22]} />
          <meshStandardMaterial color={MUST} roughness={0.45} />
        </mesh>
        {/* face screen */}
        <mesh position={[0, -0.02, 0.62]}>
          <boxGeometry args={[1.18, 0.82, 0.08]} />
          <meshStandardMaterial color="#2c2622" roughness={0.25} />
        </mesh>
        {/* screen inner glow */}
        <mesh position={[0, -0.02, 0.65]}>
          <planeGeometry args={[1.05, 0.7]} />
          <meshStandardMaterial color="#1f3b38" emissive={TEAL} emissiveIntensity={0.18} />
        </mesh>
        {/* eyes */}
        <mesh ref={eyeL} position={[-0.27, 0.06, 0.68]}>
          <circleGeometry args={[0.15, 28]} />
          <meshStandardMaterial color="#7df2d4" emissive={TEAL2} emissiveIntensity={0.7} />
        </mesh>
        <mesh ref={eyeR} position={[0.27, 0.06, 0.68]}>
          <circleGeometry args={[0.15, 28]} />
          <meshStandardMaterial color="#7df2d4" emissive={TEAL2} emissiveIntensity={0.7} />
        </mesh>
        {/* rosy cheeks */}
        <mesh position={[-0.4, -0.16, 0.66]}>
          <circleGeometry args={[0.09, 20]} />
          <meshStandardMaterial color={PINK} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0.4, -0.16, 0.66]}>
          <circleGeometry args={[0.09, 20]} />
          <meshStandardMaterial color={PINK} transparent opacity={0.85} />
        </mesh>
        {/* smile */}
        <mesh position={[0, -0.2, 0.67]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.2, 0.028, 10, 22, Math.PI]} />
          <meshStandardMaterial color={MUST2} emissive={MUST} emissiveIntensity={0.3} />
        </mesh>
        {/* antenna */}
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.4, 8]} />
          <meshStandardMaterial color={BROWN} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh ref={antenna} position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshStandardMaterial color={CORAL} emissive={CORAL} emissiveIntensity={0.6} />
        </mesh>
        {/* ears — teal discs with mustard centers */}
        {[-0.84, 0.84].map((x, i) => (
          <group key={i} position={[x, -0.05, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.14, 16]} />
              <meshStandardMaterial color={TEAL} roughness={0.4} />
            </mesh>
            <mesh position={[x > 0 ? 0.08 : -0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
              <meshStandardMaterial color={MUST} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ════ BODY ════ */}
      <group position={[0, 0.35, 0]}>
        {/* torso shell */}
        <mesh>
          <boxGeometry args={[1.4, 1.45, 1.0]} />
          <meshStandardMaterial color={TEAL} roughness={0.4} metalness={0.1} />
        </mesh>
        {/* chest panel (cream) */}
        <mesh position={[0, 0.1, 0.5]}>
          <boxGeometry args={[1.0, 1.0, 0.06]} />
          <meshStandardMaterial color={CREAM} roughness={0.55} />
        </mesh>
        {/* bottom band */}
        <mesh position={[0, -0.62, 0]}>
          <boxGeometry args={[1.42, 0.3, 1.02]} />
          <meshStandardMaterial color={MUST} roughness={0.45} />
        </mesh>
        {/* heart screen */}
        <mesh position={[0, 0.28, 0.55]}>
          <circleGeometry args={[0.2, 24]} />
          <meshStandardMaterial color={CORAL} emissive={CORAL} emissiveIntensity={0.45} />
        </mesh>
        {/* gauge dots row */}
        {[-0.22, 0, 0.22].map((x, i) => (
          <mesh key={i} position={[x, -0.18, 0.55]}>
            <circleGeometry args={[0.055, 16]} />
            <meshStandardMaterial
              color={[CORAL, MUST, TEAL][i]}
              emissive={[CORAL, MUST, TEAL][i]}
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
        {/* little dial */}
        <mesh position={[0, -0.4, 0.55]}>
          <ringGeometry args={[0.07, 0.1, 20]} />
          <meshStandardMaterial color={BROWN} />
        </mesh>
        {/* shoulder bolts */}
        {[-0.72, 0.72].map((x, i) => (
          <mesh key={i} position={[x, 0.55, 0.3]}>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshStandardMaterial color={MUST2} metalness={0.3} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ════ LEFT ARM (waves) ════ */}
      <group ref={armL} position={[-0.78, 0.72, 0]}>
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.13, 0.55, 8, 16]} />
          <meshStandardMaterial color={CORAL2} roughness={0.4} />
        </mesh>
        {/* elbow joint */}
        <mesh position={[-0.32, 0, 0]}>
          <sphereGeometry args={[0.12, 14, 14]} />
          <meshStandardMaterial color={MUST} roughness={0.4} />
        </mesh>
        {/* hand */}
        <mesh position={[-0.66, 0, 0]}>
          <sphereGeometry args={[0.18, 18, 18]} />
          <meshStandardMaterial color={TEAL2} roughness={0.4} />
        </mesh>
      </group>

      {/* ════ RIGHT ARM (paints) ════ */}
      <group ref={armR} position={[0.78, 0.72, 0.1]}>
        <mesh position={[0.3, -0.1, 0]} rotation={[0, 0, -Math.PI / 2.6]}>
          <capsuleGeometry args={[0.13, 0.55, 8, 16]} />
          <meshStandardMaterial color={CORAL2} roughness={0.4} />
        </mesh>
        <mesh position={[0.3, 0.05, 0]}>
          <sphereGeometry args={[0.12, 14, 14]} />
          <meshStandardMaterial color={MUST} roughness={0.4} />
        </mesh>
        {/* hand */}
        <mesh position={[0.58, -0.45, 0.15]}>
          <sphereGeometry args={[0.17, 18, 18]} />
          <meshStandardMaterial color={TEAL2} roughness={0.4} />
        </mesh>
        {/* brush handle */}
        <mesh position={[0.76, -0.66, 0.34]} rotation={[0.6, 0, -0.5]}>
          <cylinderGeometry args={[0.04, 0.04, 0.75, 8]} />
          <meshStandardMaterial color={BROWN} roughness={0.55} />
        </mesh>
        {/* metal ferrule */}
        <mesh position={[0.86, -0.82, 0.46]} rotation={[0.6, 0, -0.5]}>
          <cylinderGeometry args={[0.045, 0.045, 0.12, 8]} />
          <meshStandardMaterial color="#b9b2a4" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* brush tip (coral paint) */}
        <mesh position={[0.94, -0.92, 0.54]} rotation={[0.6, 0, -0.5]}>
          <coneGeometry args={[0.055, 0.22, 8]} />
          <meshStandardMaterial color={CORAL} roughness={0.6} />
        </mesh>
      </group>

      {/* ════ FEET / WHEELS ════ */}
      {[-0.42, 0.42].map((x, i) => (
        <group key={i} position={[x, -0.58, 0]}>
          <mesh>
            <sphereGeometry args={[0.24, 18, 18]} />
            <meshStandardMaterial color={BROWN} metalness={0.3} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.18]}>
            <circleGeometry args={[0.1, 16]} />
            <meshStandardMaterial color={MUST} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── Easel the robot paints on ───────────────────────────── */
function Easel({ strokes }: { strokes: { x: number; y: number; c: string; r: number }[] }) {
  return (
    <group position={[2.5, -0.1, -0.2]} rotation={[0, -0.4, 0]}>
      {/* board */}
      <mesh>
        <boxGeometry args={[1.9, 2.1, 0.08]} />
        <meshStandardMaterial color="#fffdf6" roughness={0.6} />
      </mesh>
      {/* frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.12, 2.32, 0.07]} />
        <meshStandardMaterial color={BROWN} roughness={0.65} />
      </mesh>
      {/* painted dabs */}
      {strokes.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0.05]}>
          <circleGeometry args={[s.r, 16]} />
          <meshStandardMaterial color={s.c} />
        </mesh>
      ))}
      {/* legs */}
      <mesh position={[-0.74, -1.7, -0.1]} rotation={[0, 0, 0.13]}>
        <cylinderGeometry args={[0.055, 0.055, 1.7, 8]} />
        <meshStandardMaterial color="#a8794d" roughness={0.8} />
      </mesh>
      <mesh position={[0.74, -1.7, -0.1]} rotation={[0, 0, -0.13]}>
        <cylinderGeometry args={[0.055, 0.055, 1.7, 8]} />
        <meshStandardMaterial color="#a8794d" roughness={0.8} />
      </mesh>
      {/* paint tray */}
      <mesh position={[0, -1.05, 0.12]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1.6, 0.12, 0.18]} />
        <meshStandardMaterial color={SAGE} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ─── Floating paint blobs orbiting the bot ───────────────── */
function Blob({ pos, color, phase }: { pos: [number,number,number]; color: string; phase: number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!m.current) return;
    const t = clock.getElapsedTime();
    m.current.position.y = pos[1] + Math.sin(t * 0.6 + phase) * 0.3;
    m.current.position.x = pos[0] + Math.cos(t * 0.4 + phase) * 0.2;
    m.current.rotation.y = t * 0.5;
  });
  return (
    <mesh ref={m} position={pos}>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
  );
}

/* ─── Confetti ────────────────────────────────────────────── */
function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      x: (Math.random() - 0.5) * 11,
      y0: Math.random() * 9 - 1,
      z: (Math.random() - 0.5) * 5 - 1,
      speed: 0.2 + Math.random() * 0.3,
      rot: (Math.random() - 0.5) * 3,
      color: HOLI[i % HOLI.length],
      w: 0.07 + Math.random() * 0.05,
    })),
    [],
  );
  return <>{pieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}</>;
}
function ConfettiPiece({ x, y0, z, speed, rot, color, w }: {
  x:number; y0:number; z:number; speed:number; rot:number; color:string; w:number;
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
      <boxGeometry args={[w, w * 0.5, 0.01]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── Scene wrapper ───────────────────────────────────────── */
function SceneContent() {
  const pointer = useRef({ x: 0, y: 0 });
  const [waving, setWaving] = useState(false);
  const [strokes, setStrokes] = useState<{ x:number; y:number; c:string; r:number }[]>([]);
  const tick = useRef(0);

  const blobs = useMemo(
    () => HOLI.map((color, i) => ({
      color,
      pos: [
        -3.6 + Math.cos((i / HOLI.length) * Math.PI * 2) * 0.8,
        0.6 + Math.sin((i / HOLI.length) * Math.PI * 2) * 1.4,
        -0.5 + (i % 3 - 1) * 0.4,
      ] as [number, number, number],
      phase: i * 0.9,
    })),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (t - tick.current > 0.8 && strokes.length < 24) {
      tick.current = t;
      setStrokes(s => [...s, {
        x: (Math.random() - 0.5) * 1.4,
        y: (Math.random() - 0.5) * 1.6,
        c: HOLI[Math.floor(Math.random() * HOLI.length)],
        r: 0.08 + Math.random() * 0.07,
      }]);
    }
  });

  const poke = () => {
    setWaving(true);
    setStrokes([]);
    setTimeout(() => setWaving(false), 1600);
  };

  return (
    <group
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        pointer.current.x = e.point.x / 6;
        pointer.current.y = e.point.y / 4;
      }}
    >
      <mesh position={[0, 0, -2]} visible={false}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial />
      </mesh>

      <ambientLight intensity={0.95} color="#fff4e6" />
      <directionalLight position={[4, 8, 6]} intensity={1.15} color="#fff2dc" />
      <directionalLight position={[-5, 2, -3]} intensity={0.35} color={TEAL2} />
      <pointLight position={[0, 1, 3]} intensity={0.6} color={CORAL} distance={11} />

      <Robot pointer={pointer} waving={waving} onPoke={poke} />
      <Easel strokes={strokes} />
      {blobs.map((b, i) => <Blob key={i} {...b} />)}
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
