import { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHARACTERS, PROPS } from '../../config/assets';
import { GOLEM } from '../../character/golemConfig';
import { GolemController } from '../../character/GolemController';

/**
 * The living Copper Golem. The block model has a named skeleton (legR_7,
 * legL_14, armR_31, armL_33, head_70), so we drive those nodes directly for a
 * real walk cycle and a painting arm — the brush is parented to the right arm
 * so it stays in-hand and swings with it. The GolemController supplies the
 * high-level pose (position, facing, stride, brush swing, etc.) each frame.
 */
export default function CopperGolem() {
  const { scene, animations } = useGLTF(CHARACTERS.copperGolem);
  const brushGltf = useGLTF(PROPS.brush);

  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);

  const { actions } = useAnimations(animations, inner);
  const controller = useMemo(() => new GolemController(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  // Normalize the model, locate the limb nodes, and parent the brush to the
  // right hand so it follows the arm.
  const built = useMemo(() => {
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

    const nodes = {
      legR: clone.getObjectByName('legR_7') ?? null,
      legL: clone.getObjectByName('legL_14') ?? null,
      armR: clone.getObjectByName('armR_31') ?? null,
      armL: clone.getObjectByName('armL_33') ?? null,
      head: clone.getObjectByName('head_70') ?? null,
    };
    // capture rest rotations so we drive relative to the model's bind pose
    const rest = {
      legR: nodes.legR?.rotation.clone(),
      legL: nodes.legL?.rotation.clone(),
      armR: nodes.armR?.rotation.clone(),
      armL: nodes.armL?.rotation.clone(),
      head: nodes.head?.rotation.clone(),
    };

    // brush, sized in world units then re-parented under the (scaled) right arm
    const brush = brushGltf.scene.clone(true);
    brush.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = true; });
    const bbox = new THREE.Box3().setFromObject(brush);
    const bsize = new THREE.Vector3(); bbox.getSize(bsize);
    brush.scale.setScalar(bsize.y > 0 ? 0.45 / bsize.y : 1);
    if (nodes.armR) {
      // holder undoes the model scale so its children are in world units
      const holder = new THREE.Group();
      holder.scale.setScalar(1 / s);
      holder.position.set(0.04, -0.34, -0.06);   // down the forearm to the hand
      brush.rotation.set(-1.1, 0, 0);             // bristles point down/forward
      brush.position.set(0, -0.12, 0);
      holder.add(brush);
      nodes.armR.add(holder);
    }

    return { model: clone, nodes, rest, scaleFactor: s };
  }, [scene, brushGltf]);

  // Idle facial life: blink only (the "looking left" clip animates body nodes
  // and would fight our procedural limbs).
  useEffect(() => {
    const blink = actions['blink'];
    blink?.reset().play();
    if (blink) { blink.setLoop(THREE.LoopRepeat, Infinity); blink.timeScale = 1; }
  }, [actions]);

  useFrame(({ camera, pointer: p }, dt) => {
    pointer.set(p.x, p.y);
    controller.update(dt, camera, pointer);

    const g = outer.current;
    if (g) {
      const { position, yaw, lean, bob, squash, wiggle, roll, scale } = controller.pose;
      g.position.set(position.x, position.y + bob, position.z);
      g.rotation.set(lean + roll, yaw + GOLEM.facingOffset, wiggle);
      g.scale.set(scale * squash, scale * (2 - squash), scale * squash);
    }

    // ── drive the limbs ──────────────────────────────────────────────
    const { stride, brushSwing, wiggle: wig } = controller.pose;
    const { nodes, rest } = built;
    // legs alternate, swinging from the hip during a walk
    if (nodes.legR && rest.legR) nodes.legR.rotation.x = rest.legR.x + stride * 0.7;
    if (nodes.legL && rest.legL) nodes.legL.rotation.x = rest.legL.x - stride * 0.7;
    // right arm paints (brushSwing) + counter-swings while walking
    if (nodes.armR && rest.armR) {
      nodes.armR.rotation.x = rest.armR.x - 0.25 + brushSwing * 0.85 - stride * 0.25;
    }
    // left arm swings opposite for natural locomotion
    if (nodes.armL && rest.armL) nodes.armL.rotation.x = rest.armL.x + 0.1 + stride * 0.5;
    // head tilts with the body's expressive wiggle
    if (nodes.head && rest.head) nodes.head.rotation.z = rest.head.z + wig * 0.6;
  });

  return (
    <group ref={outer} name="CopperGolem">
      <group ref={inner}>
        <primitive object={built.model} />
      </group>
    </group>
  );
}

useGLTF.preload(CHARACTERS.copperGolem);
