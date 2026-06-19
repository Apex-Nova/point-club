import { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHARACTERS, PROPS } from '../../config/assets';
import { GOLEM } from '../../character/golemConfig';
import { GolemController } from '../../character/GolemController';

/**
 * The living Copper Golem. Loads the imported model, normalizes its scale,
 * attaches a paintbrush to its hand, plays the baked blink/look clips for facial
 * life, and applies the goal-based GolemController's procedural pose every frame.
 *
 * The model is an un-rigged block golem, so locomotion and gestures are driven
 * procedurally on the wrapper group (with proper easing for weight/anticipation),
 * while the baked node-clips add subtle eye/head motion on top.
 */
export default function CopperGolem() {
  const { scene, animations } = useGLTF(CHARACTERS.copperGolem);
  const brushGltf = useGLTF(PROPS.brush);

  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const brushPivot = useRef<THREE.Group>(null);

  const { actions } = useAnimations(animations, inner);
  const controller = useMemo(() => new GolemController(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  // Normalize the model to a consistent height, base on y=0, centered.
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3(); box.getSize(size);
    const s = size.y > 0 ? GOLEM.height / size.y : 1;
    clone.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.y = -box2.min.y;
    const c = new THREE.Vector3(); box2.getCenter(c);
    clone.position.x = -c.x; clone.position.z = -c.z;
    return clone;
  }, [scene]);

  const brush = useMemo(() => {
    const clone = brushGltf.scene.clone(true);
    clone.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = true; });
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3(); box.getSize(size);
    const s = size.y > 0 ? 0.5 / size.y : 1;
    clone.scale.setScalar(s);
    return clone;
  }, [brushGltf]);

  // Idle facial life: blink on a loop; occasional "looking left".
  useEffect(() => {
    const blink = actions['blink'];
    const look = actions['looking left'];
    blink?.reset().play();
    if (blink) { blink.setLoop(THREE.LoopRepeat, Infinity); blink.timeScale = 1; }
    let raf = 0;
    const glance = () => {
      if (look && Math.random() < 0.4) { look.reset().setLoop(THREE.LoopOnce, 1); look.clampWhenFinished = true; look.play(); }
      raf = window.setTimeout(glance, 4000 + Math.random() * 6000) as unknown as number;
    };
    glance();
    return () => window.clearTimeout(raf);
  }, [actions]);

  useFrame(({ camera, pointer: p, clock }, dt) => {
    pointer.set(p.x, p.y);
    controller.update(dt, camera, pointer);

    const g = outer.current;
    if (g) {
      const { position, yaw, lean, bob, squash, wiggle, roll, scale } = controller.pose;
      g.position.set(position.x, position.y + bob, position.z);
      // facingOffset aligns the imported model's forward axis with movement
      g.rotation.set(lean + roll, yaw + GOLEM.facingOffset, wiggle);
      g.scale.set(scale * squash, scale * (2 - squash), scale * squash);
    }
    // brush swing — the painting hand
    if (brushPivot.current) {
      brushPivot.current.rotation.x = -0.4 + controller.pose.brushSwing * 0.5;
      brushPivot.current.rotation.z = Math.sin(clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={outer} name="CopperGolem">
      <group ref={inner}>
        <primitive object={model} />
      </group>
      {/* brush attached at the hand */}
      <group ref={brushPivot} position={[0.32, GOLEM.height * 0.52, 0.34]} rotation={[-0.4, 0, 0]}>
        <primitive object={brush} />
      </group>
    </group>
  );
}

useGLTF.preload(CHARACTERS.copperGolem);
