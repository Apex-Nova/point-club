import { useMemo } from 'react';
import * as THREE from 'three';
import { FOLIAGE } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { makeRng, scatter, scaleCount } from '../utils/placement';
import ScatterLayer from './foliage/ScatterLayer';
import GrassField from './foliage/GrassField';

/**
 * The handcrafted-feeling forest: ground disc + scattered trees, bushes,
 * flowers, ferns, mushrooms, rocks, pebbles, and instanced grass. Everything
 * is seeded so placement is deterministic but looks random.
 */
export default function ForestEnvironment({ lowPerf = false }: { lowPerf?: boolean }) {
  const c = WORLD.counts;
  const hole = WORLD.workshopClearRadius;
  const [wx, , wz] = WORLD.workshopPosition;
  const avoid = [{ x: wx, z: wz, r: hole }];

  // Separate RNG streams per layer so adding/removing one doesn't reshuffle others.
  const layers = useMemo(() => {
    const trees = [...FOLIAGE.trees.common, ...FOLIAGE.trees.pine, ...FOLIAGE.trees.twisted];
    return {
      trees: {
        models: trees,
        placements: scatter({
          count: scaleCount(c.trees, lowPerf), models: trees.length,
          rng: makeRng(WORLD.seed + 1), innerHole: hole + 2, radius: WORLD.groundRadius - 4,
          minScale: 1.1, maxScale: 2.2, avoid,
        }),
      },
      bushes: {
        models: FOLIAGE.bushes,
        placements: scatter({
          count: scaleCount(c.bushes, lowPerf), models: FOLIAGE.bushes.length,
          rng: makeRng(WORLD.seed + 2), innerHole: hole, minScale: 0.8, maxScale: 1.6, avoid,
        }),
      },
      flowers: {
        models: FOLIAGE.flowers,
        placements: scatter({
          count: scaleCount(c.flowers, lowPerf), models: FOLIAGE.flowers.length,
          rng: makeRng(WORLD.seed + 3), innerHole: hole - 3, minScale: 0.7, maxScale: 1.3, avoid,
        }),
      },
      ferns: {
        models: FOLIAGE.ferns,
        placements: scatter({
          count: scaleCount(c.ferns, lowPerf), models: FOLIAGE.ferns.length,
          rng: makeRng(WORLD.seed + 4), innerHole: hole, minScale: 0.8, maxScale: 1.5, avoid,
        }),
      },
      mushrooms: {
        models: FOLIAGE.mushrooms,
        placements: scatter({
          count: scaleCount(c.mushrooms, lowPerf), models: FOLIAGE.mushrooms.length,
          rng: makeRng(WORLD.seed + 5), innerHole: hole - 4, minScale: 0.7, maxScale: 1.4, avoid,
        }),
      },
      rocks: {
        models: FOLIAGE.rocks,
        placements: scatter({
          count: scaleCount(c.rocks, lowPerf), models: FOLIAGE.rocks.length,
          rng: makeRng(WORLD.seed + 6), innerHole: hole - 2, minScale: 0.6, maxScale: 1.8, avoid,
        }),
      },
      pebbles: {
        models: FOLIAGE.pebbles,
        placements: scatter({
          count: scaleCount(c.pebbles, lowPerf), models: FOLIAGE.pebbles.length,
          rng: makeRng(WORLD.seed + 7), innerHole: hole - 5, minScale: 0.6, maxScale: 1.4, avoid,
        }),
      },
    };
  }, [c, hole, lowPerf, avoid]);

  return (
    <group name="ForestEnvironment">
      <Ground />

      <ScatterLayer models={layers.trees.models} placements={layers.trees.placements}
        wind={{ strength: 0.12, pivot: 4.5 }} castShadow />
      <ScatterLayer models={layers.bushes.models} placements={layers.bushes.placements}
        wind={{ strength: 0.22, pivot: 1.2 }} castShadow />
      <ScatterLayer models={layers.ferns.models} placements={layers.ferns.placements}
        wind={{ strength: 0.3, pivot: 0.8 }} castShadow={false} />
      <ScatterLayer models={layers.flowers.models} placements={layers.flowers.placements}
        wind={{ strength: 0.35, pivot: 0.5 }} castShadow={false} />
      <ScatterLayer models={layers.mushrooms.models} placements={layers.mushrooms.placements}
        wind={false} castShadow />
      <ScatterLayer models={layers.rocks.models} placements={layers.rocks.placements}
        wind={false} castShadow receiveShadow />
      <ScatterLayer models={layers.pebbles.models} placements={layers.pebbles.placements}
        wind={false} castShadow={false} receiveShadow />

      <GrassField count={scaleCount(c.grass, lowPerf)} />
    </group>
  );
}

/** Soft mossy ground disc with a gentle radial darkening toward the edges. */
function Ground() {
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#5d7c3f', roughness: 1, metalness: 0 });
    // vertex-colour-free radial darkening via onBeforeCompile
    mat.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vDist;')
        .replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvDist = length(position.xy);');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vDist;')
        .replace('#include <dithering_fragment>',
          `#include <dithering_fragment>
          float edge = smoothstep(${(WORLD.groundRadius * 0.3).toFixed(1)}, ${WORLD.groundRadius.toFixed(1)}, vDist);
          gl_FragColor.rgb *= mix(1.0, 0.55, edge);`);
    };
    return mat;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={material}>
      <circleGeometry args={[WORLD.groundRadius, 96]} />
    </mesh>
  );
}
