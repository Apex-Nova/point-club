import { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { COPPER, COPPER_LIGHT, COPPER_DARK, PATINA, PATINA_LIGHT, EYE, EYE_CORE } from '../shared';
import type { GolemRefs } from '../hooks/useGolemAnimation';

/** Handle the scene uses to drive + read the golem. */
export interface GolemHandle extends GolemRefs {
  hand: THREE.Object3D | null;
}

const copperMat = { color: COPPER, metalness: 0.85, roughness: 0.42 } as const;
const copperDarkMat = { color: COPPER_DARK, metalness: 0.8, roughness: 0.5 } as const;
const patinaMat = { color: PATINA, metalness: 0.3, roughness: 0.7 } as const;

/**
 * CopperGolem — a blocky, voxel Minecraft-style Copper Golem built from boxes.
 * Bright copper with green oxidation patches, expressive glowing eyes and a
 * little antenna. Purely presentational: it exposes its part groups so the
 * scene's animation driver can pose it each frame.
 */
const CopperGolem = forwardRef<GolemHandle>((_props, ref) => {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Object3D>(null);

  useImperativeHandle(ref, () => ({
    get root() { return root.current; },
    get body() { return body.current; },
    get head() { return head.current; },
    get eyeL() { return eyeL.current; },
    get eyeR() { return eyeR.current; },
    get armR() { return armR.current; },
    get legL() { return legL.current; },
    get legR() { return legR.current; },
    get hand() { return hand.current; },
  }), []);

  return (
    <group ref={root}>
      {/* body authored facing +Z; scene rotates it ~180° to face the canvas */}
      <group ref={body} position={[0, 0.62, 0]}>
        {/* ── Torso ── */}
        <mesh castShadow>
          <boxGeometry args={[0.92, 1.0, 0.7]} />
          <meshStandardMaterial {...copperMat} />
        </mesh>
        {/* chest plate */}
        <mesh position={[0, 0.05, 0.36]}>
          <boxGeometry args={[0.6, 0.6, 0.04]} />
          <meshStandardMaterial {...{ color: COPPER_LIGHT, metalness: 0.9, roughness: 0.35 }} />
        </mesh>
        {/* oxidation patches */}
        <mesh position={[-0.3, -0.28, 0.36]}>
          <boxGeometry args={[0.34, 0.3, 0.06]} />
          <meshStandardMaterial {...patinaMat} />
        </mesh>
        <mesh position={[0.34, 0.26, 0.2]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.22, 0.36, 0.74]} />
          <meshStandardMaterial {...{ color: PATINA_LIGHT, metalness: 0.3, roughness: 0.75 }} />
        </mesh>
        {/* bolts */}
        {[-0.34, 0.34].map((x, i) => (
          <mesh key={i} position={[x, 0.4, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.06, 8]} />
            <meshStandardMaterial {...{ color: COPPER_DARK, metalness: 0.9, roughness: 0.3 }} />
          </mesh>
        ))}

        {/* ── Head ── */}
        <group ref={head} position={[0, 0.86, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.78, 0.66, 0.66]} />
            <meshStandardMaterial {...copperMat} />
          </mesh>
          {/* brow band */}
          <mesh position={[0, 0.18, 0.02]}>
            <boxGeometry args={[0.8, 0.16, 0.68]} />
            <meshStandardMaterial {...copperDarkMat} />
          </mesh>
          {/* patina on head corner */}
          <mesh position={[-0.32, 0.2, 0.2]}>
            <boxGeometry args={[0.2, 0.26, 0.3]} />
            <meshStandardMaterial {...patinaMat} />
          </mesh>
          {/* eye sockets */}
          <mesh position={[0, -0.02, 0.33]}>
            <boxGeometry args={[0.56, 0.24, 0.04]} />
            <meshStandardMaterial color="#2a1c12" metalness={0.2} roughness={0.6} />
          </mesh>
          {/* glowing eyes */}
          <mesh ref={eyeL} position={[-0.15, -0.02, 0.36]}>
            <boxGeometry args={[0.13, 0.16, 0.04]} />
            <meshStandardMaterial color={EYE_CORE} emissive={EYE} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          <mesh ref={eyeR} position={[0.15, -0.02, 0.36]}>
            <boxGeometry args={[0.13, 0.16, 0.04]} />
            <meshStandardMaterial color={EYE_CORE} emissive={EYE} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          {/* antenna / rod */}
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.26, 6]} />
            <meshStandardMaterial {...copperDarkMat} />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <boxGeometry args={[0.12, 0.1, 0.12]} />
            <meshStandardMaterial color={PATINA} emissive={PATINA} emissiveIntensity={0.3} metalness={0.4} roughness={0.6} />
          </mesh>
        </group>

        {/* ── Left arm (static-ish) ── */}
        <group position={[-0.6, 0.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.7, 0.26]} />
            <meshStandardMaterial {...copperMat} />
          </mesh>
          <mesh position={[0, -0.34, 0]}>
            <boxGeometry args={[0.22, 0.16, 0.24]} />
            <meshStandardMaterial {...patinaMat} />
          </mesh>
        </group>

        {/* ── Right arm (holds brush, pivots at shoulder) ── */}
        <group ref={armR} position={[0.56, 0.42, 0.1]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.24, 0.72, 0.26]} />
            <meshStandardMaterial {...copperMat} />
          </mesh>
          <mesh position={[0, -0.6, 0.04]}>
            <boxGeometry args={[0.22, 0.18, 0.24]} />
            <meshStandardMaterial color={COPPER_LIGHT} metalness={0.9} roughness={0.35} />
          </mesh>
          {/* hand anchor — scene reads world position to mount the brush */}
          <object3D ref={hand} position={[0, -0.74, 0.12]} />
        </group>

        {/* ── Legs ── */}
        <group ref={legL} position={[-0.24, -0.62, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.28, 0.5, 0.3]} />
            <meshStandardMaterial {...copperMat} />
          </mesh>
          <mesh position={[0, -0.48, 0.04]}>
            <boxGeometry args={[0.3, 0.12, 0.36]} />
            <meshStandardMaterial {...copperDarkMat} />
          </mesh>
        </group>
        <group ref={legR} position={[0.24, -0.62, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.28, 0.5, 0.3]} />
            <meshStandardMaterial {...copperMat} />
          </mesh>
          <mesh position={[0, -0.48, 0.04]}>
            <boxGeometry args={[0.3, 0.12, 0.36]} />
            <meshStandardMaterial {...copperDarkMat} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

CopperGolem.displayName = 'CopperGolem';
export default CopperGolem;
