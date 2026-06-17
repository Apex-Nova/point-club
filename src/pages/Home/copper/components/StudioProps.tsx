import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { WOOD, WOOD_D, BARK, BARK_D, STONE_D, HOLI, PLATFORM_Y } from '../shared';

export interface PropsHandle {
  /** give every prop an upward + random kick (celebration) */
  jolt: () => void;
}

const Y = PLATFORM_Y + 0.1;

/**
 * StudioProps — paint buckets, stools, crates, a palette and sketch papers,
 * each a *dynamic* Rapier body resting on the platform. They settle under
 * gravity, get shoved when the golem lands nearby, and pop on celebration.
 */
const StudioProps = forwardRef<PropsHandle>((_props, ref) => {
  const bodies = useRef<(RapierRigidBody | null)[]>([]);

  useImperativeHandle(ref, () => ({
    jolt: () => {
      bodies.current.forEach(b => {
        if (!b) return;
        b.applyImpulse({ x: (Math.random() - 0.5) * 1.2, y: 1.6 + Math.random(), z: (Math.random() - 0.5) * 1.2 }, true);
        b.applyTorqueImpulse({ x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.3, z: (Math.random() - 0.5) * 0.3 }, true);
      });
    },
  }), []);

  let idx = 0;
  const reg = (b: RapierRigidBody | null) => { bodies.current[idx++] = b; };

  return (
    <group>
      {/* paint buckets with coloured pigment */}
      {[[-2.2, -0.4, '#4cc66b'], [-2.6, 0.2, '#48b8ff'], [2.4, -0.2, '#ffd23f']].map(([x, z, c], i) => (
        <RigidBody key={`b${i}`} ref={reg} colliders="hull" position={[x as number, Y + 0.2, z as number]} restitution={0.2}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.18, 0.34, 12]} />
            <meshStandardMaterial color={STONE_D} metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 12]} />
            <meshStandardMaterial color={c as string} roughness={0.5} />
          </mesh>
        </RigidBody>
      ))}

      {/* wooden stool */}
      <RigidBody ref={reg} colliders="hull" position={[2.0, Y + 0.3, 0.6]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.3, 0.1, 12]} />
          <meshStandardMaterial color={WOOD} roughness={0.75} />
        </mesh>
        {[0, 1, 2].map(l => (
          <mesh key={l} position={[Math.cos((l / 3) * Math.PI * 2) * 0.2, 0.05, Math.sin((l / 3) * Math.PI * 2) * 0.2]} rotation={[0.12, 0, 0.12]}>
            <cylinderGeometry args={[0.035, 0.045, 0.46, 6]} />
            <meshStandardMaterial color={WOOD_D} roughness={0.8} />
          </mesh>
        ))}
      </RigidBody>

      {/* crates */}
      {[[-3.0, -1.0], [3.2, -0.8]].map(([x, z], i) => (
        <RigidBody key={`c${i}`} ref={reg} colliders="cuboid" position={[x, Y + 0.3, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color={WOOD_D} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0, 0.31]}>
            <boxGeometry args={[0.62, 0.1, 0.02]} />
            <meshStandardMaterial color={BARK} roughness={0.8} />
          </mesh>
        </RigidBody>
      ))}

      {/* palette */}
      <RigidBody ref={reg} colliders="hull" position={[-1.6, Y + 0.4, 0.9]} rotation={[0, 0.4, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.04, 16]} />
          <meshStandardMaterial color="#d8c39a" roughness={0.6} />
        </mesh>
        {HOLI.map((c, i) => (
          <mesh key={i} position={[Math.cos((i / HOLI.length) * Math.PI * 2) * 0.2, 0.03, Math.sin((i / HOLI.length) * Math.PI * 2) * 0.2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 10]} />
            <meshStandardMaterial color={c} roughness={0.5} />
          </mesh>
        ))}
      </RigidBody>

      {/* sketch papers stacked */}
      <RigidBody ref={reg} colliders="cuboid" position={[1.4, Y + 0.2, 1.1]} rotation={[0, -0.3, 0]}>
        {[0, 1, 2].map(p => (
          <mesh key={p} position={[p * 0.02, p * 0.012, p * 0.02]} rotation={[-Math.PI / 2, 0, p * 0.1]} castShadow>
            <planeGeometry args={[0.4, 0.5]} />
            <meshStandardMaterial color="#fbf6e9" roughness={0.9} side={2} />
          </mesh>
        ))}
      </RigidBody>

      {/* hanging sign on a post */}
      <group position={[-4.2, Y, 1.5]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 1.8, 6]} />
          <meshStandardMaterial color={BARK_D} roughness={0.85} />
        </mesh>
        <mesh position={[0.5, 1.6, 0]}>
          <boxGeometry args={[1.0, 0.06, 0.06]} />
          <meshStandardMaterial color={BARK_D} roughness={0.85} />
        </mesh>
        <RigidBody type="fixed" colliders={false} position={[0.7, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.5, 0.06]} />
            <meshStandardMaterial color={WOOD} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.5, 0.08, 0.02]} />
            <meshStandardMaterial color="#4cc66b" roughness={0.6} />
          </mesh>
        </RigidBody>
      </group>
    </group>
  );
});

StudioProps.displayName = 'StudioProps';
export default StudioProps;
