import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const HOLI = ['#f72585', '#7209b7', '#3a86ff', '#06d6a0', '#ffbe0b', '#fb5607', '#8338ec'];

/* ─── Pencil ──────────────────────────────────────────────── */
function Pencil() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.getElapsedTime();
    g.current.rotation.y = t * 0.38;
    g.current.position.y = Math.sin(t * 0.55) * 0.14;
  });
  return (
    <group ref={g} rotation={[0.18, 0, -0.08]}>
      {/* Yellow hexagonal body */}
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 3.6, 6]} />
        <meshStandardMaterial color="#f9c74f" roughness={0.45} />
      </mesh>
      {/* Dark stripe at -1 */}
      {[-0.5, 0.5].map((y, i) => (
        <mesh key={i} position={[0, y * 1.4, 0]}>
          <cylinderGeometry args={[0.225, 0.225, 0.06, 6]} />
          <meshStandardMaterial color="#e8a800" roughness={0.5} />
        </mesh>
      ))}
      {/* Silver band */}
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.235, 0.235, 0.16, 6]} />
        <meshStandardMaterial color="#c8c8c8" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Pink eraser */}
      <mesh position={[0, 2.12, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.3, 6]} />
        <meshStandardMaterial color="#ffb3c6" roughness={0.6} />
      </mesh>
      {/* Wood tip */}
      <mesh position={[0, -2.0, 0]}>
        <coneGeometry args={[0.22, 0.6, 6]} />
        <meshStandardMaterial color="#c4956a" roughness={0.72} />
      </mesh>
      {/* Graphite tip */}
      <mesh position={[0, -2.33, 0]}>
        <coneGeometry args={[0.048, 0.2, 6]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ─── Floating paint blob ─────────────────────────────────── */
function Blob({ pos, color, phase }: { pos: [number,number,number]; color: string; phase: number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!m.current) return;
    const t = clock.getElapsedTime();
    m.current.position.y = pos[1] + Math.sin(t * 0.55 + phase) * 0.28;
    m.current.rotation.y = t * 0.4;
    m.current.rotation.x = t * 0.25;
  });
  return (
    <mesh ref={m} position={pos}>
      <sphereGeometry args={[0.22, 14, 14]} />
      <meshStandardMaterial color={color} roughness={0.25} metalness={0.05} />
    </mesh>
  );
}

/* ─── Paint brush ─────────────────────────────────────────── */
function Brush() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.getElapsedTime();
    g.current.position.y = Math.sin(t * 0.42 + 1.1) * 0.18;
    g.current.rotation.z = Math.sin(t * 0.28 + 0.4) * 0.07 - 0.38;
  });
  return (
    <group ref={g} position={[2.6, 0.2, 0.4]} rotation={[0, 0.2, -0.5]}>
      <mesh>
        <cylinderGeometry args={[0.065, 0.065, 2.8, 8]} />
        <meshStandardMaterial color="#5c3317" roughness={0.72} />
      </mesh>
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.072, 0.072, 0.24, 8]} />
        <meshStandardMaterial color="#909090" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -1.82, 0]}>
        <coneGeometry args={[0.068, 0.55, 8]} />
        <meshStandardMaterial color="#7209b7" roughness={0.75} />
      </mesh>
    </group>
  );
}

/* ─── Paint palette ───────────────────────────────────────── */
function Palette() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.getElapsedTime();
    g.current.rotation.y = -t * 0.22;
    g.current.rotation.z = Math.sin(t * 0.33 + 2.1) * 0.12;
    g.current.position.y = Math.sin(t * 0.38 + 1.8) * 0.16;
  });
  const dots = useMemo(
    () => HOLI.slice(0, 5).map((c, i) => ({
      color: c,
      pos: [
        Math.cos((i / 5) * Math.PI * 2) * 0.44,
        0.045,
        Math.sin((i / 5) * Math.PI * 2) * 0.44,
      ] as [number, number, number],
    })),
    [],
  );
  return (
    <group ref={g} position={[-2.7, -0.4, 0.2]}>
      {/* Disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.065, 24]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.55} />
      </mesh>
      {/* Thumb hole */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.36, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.07, 16]} />
        <meshStandardMaterial color="#d8caba" roughness={0.6} />
      </mesh>
      {dots.map((d, i) => (
        <mesh key={i} position={d.pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.045, 8]} />
          <meshStandardMaterial color={d.color} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Confetti rectangles ─────────────────────────────────── */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: (Math.random() - 0.5) * 9,
        startY: Math.random() * 10 - 1,
        z: (Math.random() - 0.5) * 5 - 1,
        speed: 0.25 + Math.random() * 0.35,
        rot: (Math.random() - 0.5) * 3,
        color: HOLI[i % HOLI.length],
        w: 0.06 + Math.random() * 0.05,
        h: 0.03 + Math.random() * 0.02,
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

function ConfettiPiece({
  x, startY, z, speed, rot, color, w, h,
}: { x:number; startY:number; z:number; speed:number; rot:number; color:string; w:number; h:number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!m.current) return;
    const t = clock.getElapsedTime();
    m.current.position.y = startY - ((t * speed) % 12);
    m.current.rotation.x = t * rot;
    m.current.rotation.z = t * rot * 0.6;
  });
  return (
    <mesh ref={m} position={[x, startY, z]}>
      <boxGeometry args={[w, h, 0.008]} />
      <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── Scene content ───────────────────────────────────────── */
function SceneContent() {
  const blobs = useMemo(
    () =>
      HOLI.map((color, i) => ({
        color,
        pos: [
          Math.cos((i / HOLI.length) * Math.PI * 2) * 2.3,
          Math.sin((i / HOLI.length) * Math.PI * 2) * 1.1,
          (i % 3 - 1) * 0.55,
        ] as [number, number, number],
        phase: i * 0.88,
      })),
    [],
  );

  return (
    <>
      <ambientLight intensity={0.85} color="#ffffff" />
      <directionalLight position={[5, 9, 5]} intensity={1.3} color="#fff8e8" />
      <directionalLight position={[-4, -3, -4]} intensity={0.28} color="#ddeeff" />
      <pointLight position={[0, -2.3, 1.2]} intensity={0.7} color="#f9c74f" distance={7} />

      <Pencil />
      {blobs.map((b, i) => <Blob key={i} {...b} />)}
      <Brush />
      <Palette />
      <Confetti />
    </>
  );
}

/* ─── Exported canvas ─────────────────────────────────────── */
export default function DrawScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
}
