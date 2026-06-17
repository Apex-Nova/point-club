import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, useSpringJoint, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { BARK, BARK_D } from '../shared';

/**
 * ArtistBrush — a large wooden brush as a *dynamic* Rapier body, tethered to a
 * kinematic hand-anchor body by a spring joint. The spring gives genuine
 * secondary motion and damping: the brush lags, swings and settles as the
 * golem's hand moves. The bristle colour is driven by the live paint colour.
 */
export default function ArtistBrush({
  handRef,
  colorRef,
}: {
  handRef: RefObject<THREE.Object3D | null>;
  colorRef: RefObject<string>;
}) {
  const anchor = useRef<RapierRigidBody>(null);
  const brush = useRef<RapierRigidBody>(null);
  const bristles = useRef<THREE.MeshStandardMaterial>(null);
  const _p = useRef(new THREE.Vector3()).current;

  // Spring joint: anchor point on the hand ↔ butt of the brush handle.
  useSpringJoint(anchor, brush, [
    [0, 0, 0],     // anchor local
    [0, 0.34, 0],  // brush local (handle butt)
    0,             // rest length
    140,           // stiffness
    6,             // damping
  ]);

  useFrame(() => {
    // drive the kinematic anchor to the hand's world position each frame
    const hand = handRef.current;
    if (hand && anchor.current) {
      hand.getWorldPosition(_p);
      anchor.current.setNextKinematicTranslation(_p);
    }
    if (bristles.current && colorRef.current) {
      bristles.current.color.set(colorRef.current);
      bristles.current.emissive.set(colorRef.current);
    }
  });

  return (
    <>
      {/* invisible kinematic anchor that tracks the hand */}
      <RigidBody ref={anchor} type="kinematicPosition" colliders={false} />

      {/* the brush itself — dynamic, swings on the spring */}
      <RigidBody
        ref={brush}
        colliders="cuboid"
        position={[0, 1, 0]}
        linearDamping={2}
        angularDamping={4}
        gravityScale={0.3}
      >
        {/* wooden handle */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.7, 8]} />
          <meshStandardMaterial color={BARK} roughness={0.7} />
        </mesh>
        {/* metal ferrule */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 8]} />
          <meshStandardMaterial color="#b9b2a4" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* paint-covered bristles (colour changes with the active paint) */}
        <mesh position={[0, -0.44, 0]} castShadow>
          <coneGeometry args={[0.09, 0.26, 10]} />
          <meshStandardMaterial ref={bristles} color="#ff5d8f" emissiveIntensity={0.25} roughness={0.6} />
        </mesh>
        {/* worn paint drips on the handle */}
        <mesh position={[0.04, 0.0, 0.03]}>
          <boxGeometry args={[0.03, 0.18, 0.03]} />
          <meshStandardMaterial color={BARK_D} roughness={0.8} />
        </mesh>
      </RigidBody>
    </>
  );
}
