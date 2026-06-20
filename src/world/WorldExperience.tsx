import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, AdaptiveDpr, AdaptiveEvents, Preload } from '@react-three/drei';
import * as THREE from 'three';
import WorldRoot from './scene/WorldRoot';
import DebugPanel from './debug/DebugPanel';
import ScreenStain from './character/ScreenStain';
import { useScrollTimeline } from './timeline/useScrollTimeline';
import { preloadWorldAssets } from './loaders/preload';
import { triggerScreenStain } from './character/fourthWall';

preloadWorldAssets();

const isLowPerf = () =>
  typeof window !== 'undefined' &&
  (window.innerWidth < 820 || (navigator.hardwareConcurrency ?? 8) <= 4);

/**
 * Phase 1 entry point. A fixed full-screen 3D world behind a tall scroll region
 * that drives the master timeline. One continuous scene — no sections or cards.
 */
export default function WorldExperience() {
  const lowPerf = useMemo(isLowPerf, []);
  useScrollTimeline();

  return (
    <>
      {/* Fixed 3D world. Clicking the scene can trigger the golem's screen-stain
          set-piece (the signature fourth-wall interaction). */}
      <div
        className="fixed inset-0"
        style={{ background: '#f0e3c4' }}
        onPointerDown={e => triggerScreenStain(e.clientX, e.clientY)}
      >
        <Canvas
          shadows
          dpr={[1, lowPerf ? 1.2 : 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.14;
            if (import.meta.env.DEV) Object.assign(window as object, { __gl: gl, __scene: scene });
          }}
        >
          <Suspense fallback={null}>
            <WorldRoot lowPerf={lowPerf} />
            <Preload all />
          </Suspense>
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Canvas>

        {/* Cinematic colour grade — warm glow lift (screen) + soft vignette,
            for the stylized Genshin / Ni-no-Kuni atmosphere without postFX. */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
          background: 'radial-gradient(120% 100% at 50% 38%, rgba(255,236,190,0.22) 0%, rgba(255,214,150,0.06) 35%, rgba(40,60,40,0.0) 60%)',
          mixBlendMode: 'screen',
        }} />
        {/* soft diagonal sun-ray streaks from the upper-right (matches the sun) */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, opacity: 0.6,
          background: 'linear-gradient(108deg, transparent 28%, rgba(255,242,205,0.10) 40%, transparent 45%, transparent 56%, rgba(255,238,195,0.07) 66%, transparent 72%)',
          mixBlendMode: 'screen',
        }} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
          background: 'radial-gradient(130% 110% at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,30,18,0.28) 100%)',
        }} />
      </div>

      {/* Tall spacer gives the page its scroll length. Pointer-events off so the
          canvas still receives parallax pointer moves. */}
      <div style={{ height: '400vh', position: 'relative', pointerEvents: 'none' }} />

      {/* Paint stain on the camera layer (above the canvas, below dev UI). */}
      <ScreenStain />

      {/* Loading screen + dev controls */}
      <Loader
        containerStyles={{ background: '#1b2417' }}
        barStyles={{ background: '#7ec88a' }}
        dataStyles={{ color: '#cfe8c9', fontFamily: 'var(--font-display, sans-serif)' }}
      />
      {import.meta.env.DEV && <DebugPanel />}
    </>
  );
}
