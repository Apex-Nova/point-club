import { lazy, Suspense } from 'react';

/**
 * Home — the immersive Copper Golem forest world (Phase 1).
 * One continuous 3D scene; the world is loaded lazily so the rest of the app
 * isn't burdened with the three.js bundle.
 */
const WorldExperience = lazy(() => import('@/world/WorldExperience'));

export default function Home() {
  return (
    <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#1b2417' }} />}>
      <WorldExperience />
    </Suspense>
  );
}
