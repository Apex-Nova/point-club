import { useControls, Leva } from 'leva';
import { useEffect } from 'react';
import { useWorldStore } from '../state/worldStore';
import { WORLD_DEFAULTS } from '../config/worldConfig';

/**
 * Development-only controls. Hidden entirely in production builds.
 * Lets us tune wind, particle density, atmosphere and scrub the timeline live.
 */
export default function DebugPanel() {
  const set = useWorldStore(s => s.set);
  const scrollProgress = useWorldStore(s => s.scrollProgress);

  const { windStrength, particleDensity, atmosphereIntensity, scrub } = useControls('World', {
    windStrength: { value: WORLD_DEFAULTS.windStrength, min: 0, max: 3, step: 0.05 },
    particleDensity: { value: WORLD_DEFAULTS.particleDensity, min: 0, max: 1, step: 0.01 },
    atmosphereIntensity: { value: WORLD_DEFAULTS.atmosphereIntensity, min: 0, max: 1, step: 0.01 },
    scrub: { value: 0, min: 0, max: 1, step: 0.01, label: 'scrollProgress' },
  });

  useEffect(() => { set({ windStrength }); }, [windStrength, set]);
  useEffect(() => { set({ particleDensity }); }, [particleDensity, set]);
  useEffect(() => { set({ atmosphereIntensity }); }, [atmosphereIntensity, set]);
  // manual scrub overrides scroll only when dragged away from 0
  useEffect(() => { if (scrub > 0) set({ scrollProgress: scrub }); }, [scrub, set]);

  return <Leva collapsed titleBar={{ title: `World · scroll ${(scrollProgress * 100).toFixed(0)}%` }} />;
}
