import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, AdaptiveDpr, AdaptiveEvents, Preload } from '@react-three/drei';
import * as THREE from 'three';
import WorldRoot from './scene/WorldRoot';
import DebugPanel from './debug/DebugPanel';
import { useScrollTimeline } from './timeline/useScrollTimeline';
import { preloadWorldAssets } from './loaders/preload';

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
      {/* Fixed 3D world */}
      <div className="fixed inset-0" style={{ background: '#f0e3c4' }}>
        <Canvas
          shadows
          dpr={[1, lowPerf ? 1.5 : 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
          }}
        >
          <Suspense fallback={null}>
            <WorldRoot lowPerf={lowPerf} />
            <Preload all />
          </Suspense>
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
        </Canvas>
      </div>

      {/* Tall spacer gives the page its scroll length. Pointer-events off so the
          canvas still receives parallax pointer moves. */}
      <div style={{ height: '400vh', position: 'relative', pointerEvents: 'none' }} />

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
