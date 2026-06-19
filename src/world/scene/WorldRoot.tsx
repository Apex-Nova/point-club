import { Suspense } from 'react';
import CameraRig from './CameraRig';
import LightingSystem from './LightingSystem';
import ForestEnvironment from './ForestEnvironment';
import HeroTree from './HeroTree';
import CanvasWorkshop from './CanvasWorkshop';
import WaterFeature from './WaterFeature';
import Fauna from './Fauna';
import AtmosphereSystem from './AtmosphereSystem';
import ParticleSystem from './ParticleSystem';
import WindUpdater from './WindUpdater';
import CopperGolem from './characters/CopperGolem';

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

      {/* Pond + waterfall and the wildlife load independently of the core world. */}
      <Suspense fallback={null}>
        <WaterFeature />
      </Suspense>
      <Suspense fallback={null}>
        <Fauna lowPerf={lowPerf} />
      </Suspense>

      {/* The living resident — loads independently so the world shows first. */}
      <Suspense fallback={null}>
        <CopperGolem />
      </Suspense>

      <AtmosphereSystem lowPerf={lowPerf} />
      <ParticleSystem lowPerf={lowPerf} />
    </group>
  );
}
