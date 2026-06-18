import CameraRig from './CameraRig';
import LightingSystem from './LightingSystem';
import ForestEnvironment from './ForestEnvironment';
import HeroTree from './HeroTree';
import CanvasWorkshop from './CanvasWorkshop';
import AtmosphereSystem from './AtmosphereSystem';
import ParticleSystem from './ParticleSystem';
import WindUpdater from './WindUpdater';

/**
 * The complete world graph (Phase 1). The Copper Golem is intentionally absent —
 * this is the set, ready for the actor.
 *
 *   WorldRoot
 *   ├── CameraRig
 *   ├── LightingSystem
 *   ├── ForestEnvironment
 *   ├── HeroTree
 *   ├── CanvasWorkshop
 *   ├── AtmosphereSystem
 *   ├── ParticleSystem (Holi powder)
 *   └── WindUpdater
 */
export default function WorldRoot({ lowPerf = false }: { lowPerf?: boolean }) {
  return (
    <group name="WorldRoot">
      <CameraRig />
      <LightingSystem />
      <WindUpdater />

      <ForestEnvironment lowPerf={lowPerf} />
      <HeroTree />
      <CanvasWorkshop />

      <AtmosphereSystem lowPerf={lowPerf} />
      <ParticleSystem lowPerf={lowPerf} />
    </group>
  );
}
