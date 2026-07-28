import { lazy, Suspense } from 'react';
import HeroEntry from '@/components/landing/HeroEntry';

/**
 * Home — the immersive Copper Golem forest world (Phase 1).
 * One continuous 3D scene; the world is loaded lazily so the rest of the app
 * isn't burdened with the three.js bundle. HeroEntry overlays a clear CTA so
 * visitors always have an obvious way into the app.
 */
const WorldExperience = lazy(() => import('@/world/WorldExperience'));

export default function Home() {
  return (
    <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#1b2417' }} />}>
      <WorldExperience />
      <HeroEntry />
    </Suspense>
  );
}
