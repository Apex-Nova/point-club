import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ── Single animated tree ───────────────────────────────────── */
function Tree({
  position,
  scale = 1,
  phase = 0,
}: {
  position: [number, number, number];
  scale?: number;
  phase?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // gentle sway — each tree has its own phase
    groupRef.current.rotation.z = Math.sin(t * 0.4 + phase) * 0.018;
    groupRef.current.rotation.x = Math.sin(t * 0.3 + phase * 1.3) * 0.008;
  });

  const trunkColor   = '#3b1a08';
  const foliage1     = '#1a4d1e'; // darkest base layer
  const foliage2     = '#276630'; // mid
  const foliage3     = '#34854a'; // lightest tip

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.08, 0.13, 1.8, 7]} />
        <meshStandardMaterial color={trunkColor} roughness={0.95} />
      </mesh>

      {/* Foliage — 3 stacked cones, each slightly smaller and higher */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[0.95, 1.4, 8]} />
        <meshStandardMaterial color={foliage1} roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <coneGeometry args={[0.72, 1.2, 8]} />
        <meshStandardMaterial color={foliage2} roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.9, 0]}>
        <coneGeometry args={[0.48, 0.95, 8]} />
        <meshStandardMaterial color={foliage3} roughness={0.75} />
      </mesh>
    </group>
  );
}

/* ── Ground plane ───────────────────────────────────────────── */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color="#0b2210" roughness={1} />
    </mesh>
  );
}

/* ── Firefly particles ──────────────────────────────────────── */
function Fireflies({ count = 80 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, phases } = useMemo(() => {
    const pos: number[] = [];
    const ph: number[] = [];
    for (let i = 0; i < count; i++) {
      pos.push(
        (Math.random() - 0.5) * 40,
        Math.random() * 6 + 1,
        (Math.random() - 0.5) * 20 - 5,
      );
      ph.push(Math.random() * Math.PI * 2);
    }
    return { positions: new Float32Array(pos), phases: ph };
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      pos.setY(i, 1.5 + Math.sin(t * 0.6 + phases[i]) * 1.2 + (i % 5) * 0.4);
      pos.setX(i, positions[i * 3] + Math.sin(t * 0.25 + phases[i] * 2) * 0.6);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a8f0a8"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.85}
      />
    </points>
  );
}

/* ── Mushroom cluster ───────────────────────────────────────── */
function Mushroom({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.24, 6]} />
        <meshStandardMaterial color="#d4a96a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c0392b" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ── Forest scene ───────────────────────────────────────────── */
function ForestContent() {
  const trees = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number; phase: number }[] = [];

    // Back row (far)
    for (let i = 0; i < 16; i++) {
      result.push({
        pos: [-22 + i * 3 + (Math.random() - 0.5) * 1.5, 0, -18 + Math.random() * 3] as [number, number, number],
        scale: 0.9 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Mid row
    for (let i = 0; i < 10; i++) {
      result.push({
        pos: [-14 + i * 3 + (Math.random() - 0.5) * 1.2, 0, -10 + Math.random() * 2] as [number, number, number],
        scale: 0.75 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Side clusters (left)
    for (let i = 0; i < 8; i++) {
      result.push({
        pos: [-16 + Math.random() * 2, 0, -6 + i * 2 + Math.random()] as [number, number, number],
        scale: 0.65 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }
    // Side clusters (right)
    for (let i = 0; i < 8; i++) {
      result.push({
        pos: [14 + Math.random() * 2, 0, -6 + i * 2 + Math.random()] as [number, number, number],
        scale: 0.65 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }

    return result;
  }, []);

  const mushrooms: [number, number, number][] = useMemo(
    () =>
      Array.from({ length: 14 }, () => [
        (Math.random() - 0.5) * 24,
        0,
        (Math.random() - 0.5) * 12 - 2,
      ] as [number, number, number]),
    [],
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.18} color="#203a26" />
      <directionalLight
        position={[5, 12, 6]}
        intensity={0.55}
        color="#a8d8a8"
        castShadow
      />
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#4ade80" distance={20} />
      {/* Moonlight */}
      <directionalLight position={[-8, 20, -12]} intensity={0.3} color="#b8d4ff" />

      <fog attach="fog" color="#030d06" near={14} far={40} />

      <Stars radius={60} depth={30} count={2000} factor={3} saturation={0.3} fade />

      <Ground />

      {trees.map((t, i) => (
        <Tree key={i} position={t.pos} scale={t.scale} phase={t.phase} />
      ))}

      {mushrooms.map((pos, i) => (
        <Mushroom key={i} position={pos} />
      ))}

      <Fireflies count={90} />
    </>
  );
}

/* ── Exported canvas wrapper ────────────────────────────────── */
export default function ForestScene() {
  return (
    <Canvas
      camera={{ position: [0, 4.5, 12], fov: 62, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#030d06' }}
      shadows
    >
      <ForestContent />
    </Canvas>
  );
}
