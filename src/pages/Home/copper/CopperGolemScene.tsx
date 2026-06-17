import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { Physics, RigidBody, CapsuleCollider, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Volume2, VolumeX } from 'lucide-react';

import CopperGolem, { type GolemHandle } from './components/CopperGolem';
import ArtistBrush from './components/ArtistBrush';
import GiantCanvas from './components/GiantCanvas';
import StudioProps, { type PropsHandle } from './components/StudioProps';
import ForestEnvironment from './components/ForestEnvironment';
import CameraRig from './components/CameraRig';
import PaintParticles, { type ParticlesHandle } from './components/PaintParticles';

import { usePainting } from './hooks/usePainting';
import { useMouseTarget } from './hooks/useMouseTarget';
import { useGolemAnimation } from './hooks/useGolemAnimation';
import { GolemStateMachine, CLICK_TIMELINE } from './systems/GolemStateMachine';
import { interactionPose, type InteractionPose } from './systems/InteractionSystem';
import { AudioSystem } from './systems/AudioSystem';
import { CANVAS_CENTER, CANVAS_W, PLATFORM_Y, SUN } from './shared';

const NEUTRAL: InteractionPose = {
  jumpY: 0, squashY: 1, squashXZ: 1, spin: 0, faceUser: 0, wave: 0, stepBack: 0, landed: false, burst: false,
};

/* ════════════════════════════════════════════════════════════
   Controller — the single master frame loop that drives the whole
   Copper Golem experience (painting, AI behaviour, physics sync, fx).
   ════════════════════════════════════════════════════════════ */
function Controller({ audio, clickRef }: { audio: AudioSystem; clickRef: React.MutableRefObject<number> }) {
  const { raycaster, camera } = useThree();

  const paint = usePainting(1024);
  const mouse = useMouseTarget();
  const golemAnim = useGolemAnimation();
  const machine = useMemo(() => new GolemStateMachine(), []);

  const golem = useRef<GolemHandle>(null);
  const props = useRef<PropsHandle>(null);
  const particles = useRef<ParticlesHandle>(null);
  const golemBody = useRef<RapierRigidBody>(null);
  const handRef = useRef<THREE.Object3D | null>(null);

  const pointerRef = useRef({ x: 0, y: 0 });
  const focusRef = useRef(0);
  const colorRef = useRef(paint.color);

  const clickClock = useRef(Infinity);
  const prevClick = useRef(Infinity);
  const lastClick = useRef(0);
  const golemX = useRef(0);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -CANVAS_CENTER.z), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const brushWorld = useMemo(() => new THREE.Vector3(), []);
  const brushTickT = useRef(0);
  const footT = useRef(0);

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime;

    // ── pointer parallax + canvas target ────────────────────────
    pointerRef.current.x = state.pointer.x;
    pointerRef.current.y = state.pointer.y;
    raycaster.setFromCamera(state.pointer as THREE.Vector2, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) mouse.setFromWorld(hit);
    const tgt = mouse.update(dt);
    paint.setTarget(tgt ? tgt.u : null, tgt?.v);

    // ── advance the painting ────────────────────────────────────
    const pen = paint.update(dt);
    colorRef.current = paint.color;

    // ── click → trigger scripted interaction ────────────────────
    if (clickRef.current !== lastClick.current) {
      lastClick.current = clickRef.current;
      machine.triggerClick();
      clickClock.current = 0; prevClick.current = 0;
      audio.blipCute();
    }
    if (clickClock.current !== Infinity) {
      prevClick.current = clickClock.current;
      clickClock.current += dt;
      if (clickClock.current > CLICK_TIMELINE.done) clickClock.current = Infinity;
    }

    // ── golem paint slot + state machine ────────────────────────
    const paintX = THREE.MathUtils.clamp((pen.x - 0.5) * CANVAS_W * 0.55, -3, 3);
    const dist = Math.abs(golemX.current - paintX);
    const gState = machine.update(dt, { distanceToTarget: dist, sinceClick: clickClock.current });

    const pose = clickClock.current !== Infinity
      ? interactionPose(clickClock.current, prevClick.current)
      : NEUTRAL;

    const inClick = gState === 'interaction' || gState === 'celebration';
    const targetX = inClick ? golemX.current : paintX;

    // ── apply the blended pose ──────────────────────────────────
    if (golem.current) {
      golemAnim.update(golem.current, {
        dt, time, state: gState, targetX,
        penU: pen.x, penV: pen.y, faceUser: pose.faceUser, pose,
      });
      if (golem.current.root) golemX.current = golem.current.root.position.x;
      handRef.current = golem.current.hand;
    }

    // ── camera focus envelope ───────────────────────────────────
    if (clickClock.current !== Infinity) {
      const t = clickClock.current, D = CLICK_TIMELINE.done;
      focusRef.current = THREE.MathUtils.clamp(Math.min(t / 0.7, (D - t) / 0.7), 0, 1);
    } else {
      focusRef.current = THREE.MathUtils.lerp(focusRef.current, 0, dt * 4);
    }

    // ── sync kinematic capsule so the golem shoves props ────────
    if (golemBody.current && golem.current?.root) {
      const p = golem.current.root.position;
      golemBody.current.setNextKinematicTranslation({ x: p.x, y: p.y + 0.9, z: p.z });
    }

    // ── paint pigment dust + brush ticks ────────────────────────
    if (paint.justPainted && handRef.current) {
      handRef.current.getWorldPosition(brushWorld);
      if (Math.random() < 0.5) particles.current?.emit(brushWorld, 2, 0.18, 0.5);
      brushTickT.current += dt;
      if (brushTickT.current > 0.12) { brushTickT.current = 0; audio.brushTick(); }
    }

    // ── footsteps while walking ─────────────────────────────────
    if (gState === 'walking') {
      footT.current += dt;
      if (footT.current > 0.32) { footT.current = 0; audio.footstep(); }
    }

    // ── landing + celebration events ────────────────────────────
    if (pose.landed) {
      audio.thud();
      particles.current?.emit(new THREE.Vector3(golemX.current, PLATFORM_Y + 0.1, 0), 18, 0.5, 1.2);
    }
    if (pose.burst) {
      audio.chime();
      paint.celebrate();
      props.current?.jolt();
      particles.current?.emit(new THREE.Vector3(golemX.current, PLATFORM_Y + 1.2, 0), 64, 0.9, 2.2);
    }

    audio.tickAmbient(dt);
  });

  return (
    <>
      {/* warm forest lighting */}
      <ambientLight intensity={0.8} color="#fff6e0" />
      <hemisphereLight args={['#bfe9ff', '#4a7a3a', 0.55]} />
      <directionalLight
        position={[6, 10, 5]} intensity={1.6} color={SUN} castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-near={1} shadow-camera-far={36}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14}
      />
      <fog attach="fog" args={['#dff3e4', 16, 36]} />

      <ForestEnvironment />
      <GiantCanvas texture={paint.texture} />

      <Physics gravity={[0, -9.81, 0]}>
        {/* platform floor collider so props rest on the wood */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[7, 0.2, 7]} position={[0, PLATFORM_Y - 0.05, -1]} />
        </RigidBody>

        {/* golem visual + kinematic capsule that pushes props */}
        <CopperGolem ref={golem} />
        <RigidBody ref={golemBody} type="kinematicPosition" colliders={false}>
          <CapsuleCollider args={[0.5, 0.5]} />
        </RigidBody>

        <ArtistBrush handRef={handRef} colorRef={colorRef} />
        <StudioProps ref={props} />
      </Physics>

      <PaintParticles ref={particles} />
      <CameraRig pointerRef={pointerRef} focusRef={focusRef} />
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Public scene — Canvas + quality scaling + ambient-audio toggle
   ════════════════════════════════════════════════════════════ */
export default function CopperGolemScene() {
  const audio = useMemo(() => new AudioSystem(), []);
  const clickRef = useRef(0);
  const [muted, setMuted] = useState(true);
  const [dpr, setDpr] = useState<number>(1.6);

  return (
    <div style={{ position: 'absolute', inset: 0 }} onPointerDown={() => { clickRef.current++; }}>
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: [0, 1.4, 9.2], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <Controller audio={audio} clickRef={clickRef} />
          <Environment preset="park" />
        </Suspense>
      </Canvas>

      {/* ambient-audio toggle (off by default) */}
      <button
        onClick={(e) => { e.stopPropagation(); const m = !muted; setMuted(m); audio.setEnabled(!m); }}
        title={muted ? 'Enable sound' : 'Mute sound'}
        style={{
          position: 'absolute', bottom: 18, right: 18, zIndex: 20,
          width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(32,92,44,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(32,92,44,0.18)',
        }}
      >
        {muted ? <VolumeX size={18} color="#205c2c" /> : <Volume2 size={18} color="#205c2c" />}
      </button>
    </div>
  );
}
