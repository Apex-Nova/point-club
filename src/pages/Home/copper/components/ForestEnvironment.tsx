import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  LEAF, LEAF_D, GRASS, BARK, BARK_D, WOOD, WOOD_D, STONE, STONE_D, SUN, PLATFORM_Y,
} from '../shared';

/**
 * ForestEnvironment — the art studio set inside the forest: a large wooden
 * platform on a natural stone base, ringed by swaying trees, grass, flowers,
 * small bushes and tree roots, with leaves drifting down through the light.
 * Trees/grass are instanced for performance.
 */

function Trees({ count = 12 }: { count?: number }) {
  const foliage = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => Array.from({ length: count }, (_, i) => {
    const ang = (i / count) * Math.PI * 2;
    const rad = 7 + Math.random() * 6;
    return {
      pos: [Math.cos(ang) * rad, PLATFORM_Y, -4 - Math.abs(Math.sin(ang)) * rad * 0.6 - Math.random() * 2] as [number, number, number],
      scale: 0.9 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
    };
  }), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!foliage.current || !trunks.current) return;
    data.forEach((d, i) => {
      const sway = Math.sin(t * 0.7 + d.phase) * 0.05;
      dummy.position.set(d.pos[0], d.pos[1] + 2.6 * d.scale, d.pos[2]);
      dummy.rotation.set(sway, d.phase, sway * 0.5);
      dummy.scale.setScalar(d.scale * 1.5);
      dummy.updateMatrix();
      foliage.current!.setMatrixAt(i, dummy.matrix);
      dummy.position.set(d.pos[0], d.pos[1] + 1.0 * d.scale, d.pos[2]);
      dummy.rotation.set(0, 0, sway * 0.4);
      dummy.scale.set(d.scale, d.scale, d.scale);
      dummy.updateMatrix();
      trunks.current!.setMatrixAt(i, dummy.matrix);
    });
    foliage.current.instanceMatrix.needsUpdate = true;
    trunks.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 2.0, 6]} />
        <meshStandardMaterial color={BARK} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={foliage} args={[undefined, undefined, count]} castShadow>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color={LEAF} roughness={0.85} flatShading />
      </instancedMesh>
    </group>
  );
}

function GrassAndFlowers() {
  const grass = useRef<THREE.InstancedMesh>(null);
  const COUNT = 180;
  const blades = useMemo(() => Array.from({ length: COUNT }, () => {
    const r = 3.5 + Math.random() * 9;
    const a = Math.random() * Math.PI * 2;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r * 0.7 - 2, h: 0.3 + Math.random() * 0.5, phase: Math.random() * 7 };
  }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!grass.current) return;
    blades.forEach((b, i) => {
      dummy.position.set(b.x, PLATFORM_Y + b.h / 2, b.z);
      dummy.rotation.set(0, 0, Math.sin(t * 1.5 + b.phase) * 0.25);
      dummy.scale.set(0.06, b.h, 0.06);
      dummy.updateMatrix();
      grass.current!.setMatrixAt(i, dummy.matrix);
    });
    grass.current.instanceMatrix.needsUpdate = true;
  });
  const flowers = useMemo(() => Array.from({ length: 20 }, () => {
    const r = 3 + Math.random() * 7;
    const a = Math.random() * Math.PI * 2;
    return { pos: [Math.cos(a) * r, PLATFORM_Y + 0.05, Math.sin(a) * r * 0.7 - 2] as [number, number, number], c: ['#ff8fab', '#ffd166', '#9b5de5', '#fff'][(Math.random() * 4) | 0], s: 0.5 + Math.random() * 0.5 };
  }), []);
  return (
    <group>
      <instancedMesh ref={grass} args={[undefined, undefined, COUNT]}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={LEAF_D} roughness={1} />
      </instancedMesh>
      {flowers.map((f, i) => (
        <group key={i} position={f.pos} scale={f.s}>
          {[0, 1, 2, 3, 4].map(p => (
            <mesh key={p} rotation={[Math.PI / 2, 0, (p / 5) * Math.PI * 2]} position={[Math.cos((p / 5) * Math.PI * 2) * 0.12, 0, Math.sin((p / 5) * Math.PI * 2) * 0.12]}>
              <circleGeometry args={[0.1, 8]} />
              <meshStandardMaterial color={f.c} side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
          ))}
          <mesh rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.06, 8]} /><meshStandardMaterial color={SUN} /></mesh>
        </group>
      ))}
    </group>
  );
}

function FallingLeaves() {
  const ref = useRef<THREE.Group>(null);
  const leaves = useMemo(() => Array.from({ length: 18 }, () => ({
    x: (Math.random() - 0.5) * 14, y: Math.random() * 6, z: (Math.random() - 0.5) * 8 - 1,
    rot: Math.random() * Math.PI, speed: 0.3 + Math.random() * 0.4, sway: Math.random() * 7,
    c: Math.random() > 0.5 ? LEAF : '#7cae4a',
  })), []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current?.children.forEach((leaf, i) => {
      const l = leaves[i];
      leaf.position.y = PLATFORM_Y + 5.5 - ((t * l.speed + l.y) % 6);
      leaf.position.x = l.x + Math.sin(t + l.sway) * 0.6;
      leaf.rotation.x = t * 1.5 + l.rot;
      leaf.rotation.z = t * 1.2 + l.rot;
    });
  });
  return (
    <group ref={ref}>
      {leaves.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, l.z]}>
          <circleGeometry args={[0.1, 5]} />
          <meshStandardMaterial color={l.c} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export default function ForestEnvironment() {
  return (
    <group>
      {/* stone base */}
      <mesh position={[0, PLATFORM_Y - 0.9, -1]} receiveShadow>
        <cylinderGeometry args={[6.5, 7.2, 1.6, 12]} />
        <meshStandardMaterial color={STONE} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, PLATFORM_Y - 0.45, -1]} receiveShadow>
        <cylinderGeometry args={[6.0, 6.5, 0.4, 12]} />
        <meshStandardMaterial color={STONE_D} roughness={0.95} flatShading />
      </mesh>
      {/* wooden platform top */}
      <mesh position={[0, PLATFORM_Y - 0.1, -1]} receiveShadow>
        <cylinderGeometry args={[5.6, 5.8, 0.3, 10]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      {/* plank lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, PLATFORM_Y + 0.06, -1]} rotation={[-Math.PI / 2, 0, (i / 6) * Math.PI]}>
          <planeGeometry args={[11.2, 0.04]} />
          <meshStandardMaterial color={WOOD_D} roughness={0.85} />
        </mesh>
      ))}
      {/* surrounding ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PLATFORM_Y - 1.7, -2]} receiveShadow>
        <circleGeometry args={[22, 40]} />
        <meshStandardMaterial color={GRASS} roughness={1} />
      </mesh>
      {/* tree roots creeping over the stone */}
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * 4.8, PLATFORM_Y - 0.4, 0.5]} rotation={[0, 0, s * 0.5]}>
          <torusGeometry args={[0.5, 0.12, 6, 10, Math.PI]} />
          <meshStandardMaterial color={BARK_D} roughness={0.9} />
        </mesh>
      ))}
      {/* small bushes */}
      {[[-3.5, 2.4], [3.2, 1.8], [-2, 3]].map(([x, z], i) => (
        <mesh key={i} position={[x, PLATFORM_Y + 0.2, z]} castShadow>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color={LEAF_D} roughness={0.85} flatShading />
        </mesh>
      ))}

      <Trees />
      <GrassAndFlowers />
      <FallingLeaves />
    </group>
  );
}
