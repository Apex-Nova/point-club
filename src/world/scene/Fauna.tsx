import { useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FAUNA } from '../config/assets';
import { WORLD } from '../config/worldConfig';

/**
 * Ambient wildlife that makes the world feel inhabited:
 *  - fish circling just beneath the pond surface (baked swim clips)
 *  - butterflies fluttering over the flower beds (baked clip + drift)
 *  - birds gliding in slow arcs above the clearing (procedural flight)
 */
export default function Fauna({ lowPerf = false }: { lowPerf?: boolean }) {
  const fishCount = lowPerf ? 3 : 6;
  return (
    <group name="Fauna">
      {Array.from({ length: fishCount }).map((_, i) => (
        <Fish key={i} index={i} />
      ))}
      <Butterflies />
      {!lowPerf && <Bird model={FAUNA.birds[0]} radius={20} height={10} speed={0.18} dir={1} />}
      <Bird model={FAUNA.birds[1]} radius={13} height={7} speed={0.32} dir={-1} />
      <Bird model={FAUNA.birds[0]} radius={26} height={13} speed={0.12} dir={1} phase={3} />
    </group>
  );
}

/** One fish circling under the pond surface. */
function Fish({ index }: { index: number }) {
  const url = FAUNA.fish[index % FAUNA.fish.length];
  const { scene, animations } = useGLTF(url);
  const model = useMemo(() => skeletonClone(scene), [scene]);
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, group);

  const cfg = useMemo(() => {
    const [px, , pz] = WORLD.pond.center;
    return {
      px, pz,
      r: 1.2 + (index % 3) * 1.3,
      speed: 0.25 + (index % 4) * 0.08,
      phase: index * 1.7,
      depth: WORLD.pond.waterY - 0.35 - (index % 2) * 0.2,
      scale: 0.5 + (index % 3) * 0.12,
    };
  }, [index]);

  useMemo(() => {
    const first = Object.values(actions)[0];
    first?.reset().play();
  }, [actions]);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime * cfg.speed + cfg.phase;
    const x = cfg.px + Math.cos(t) * cfg.r;
    const z = cfg.pz + Math.sin(t) * cfg.r;
    g.position.set(x, cfg.depth + Math.sin(t * 2) * 0.05, z);
    g.rotation.y = -t + Math.PI / 2; // face along the circular path
  });

  return <group ref={group} scale={cfg.scale}><primitive object={model} /></group>;
}

/** The butterfly swarm — one baked-animation pack drifting over the flowers. */
function Butterflies() {
  const { scene, animations } = useGLTF(FAUNA.butterflies);
  const model = useMemo(() => skeletonClone(scene), [scene]);
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, group);

  useMemo(() => { Object.values(actions)[0]?.reset().play(); }, [actions]);

  // hover over a flowery spot between the workshop and the pond
  const anchor = useMemo(() => new THREE.Vector3(-4, 1.4, 5), []);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.position.set(
      anchor.x + Math.sin(t * 0.3) * 2.5,
      anchor.y + Math.sin(t * 0.7) * 0.5,
      anchor.z + Math.cos(t * 0.23) * 2.5,
    );
    g.rotation.y = t * 0.15;
  });

  return <group ref={group} scale={0.5}><primitive object={model} /></group>;
}

/** A bird gliding in a slow banked arc above the world (procedural). */
function Bird({
  model, radius, height, speed, dir, phase = 0,
}: { model: string; radius: number; height: number; speed: number; dir: 1 | -1; phase?: number }) {
  const { scene } = useGLTF(model);
  const clone = useMemo(() => {
    const c = skeletonClone(scene);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3(); box.getSize(size);
    const s = size.length() > 0 ? 1.1 / size.length() : 1; // normalize to a sensible bird size
    c.scale.setScalar(s);
    return c;
  }, [scene]);
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime * speed * dir + phase;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    g.position.set(x, height + Math.sin(t * 2) * 0.6, z);
    g.rotation.y = -t * dir;            // face flight direction
    g.rotation.z = Math.sin(t * 2) * 0.25; // bank into the turn
  });

  return <group ref={group}><primitive object={clone} /></group>;
}

useGLTF.preload(FAUNA.butterflies);
FAUNA.fish.forEach(f => useGLTF.preload(f));
FAUNA.birds.forEach(b => useGLTF.preload(b));
