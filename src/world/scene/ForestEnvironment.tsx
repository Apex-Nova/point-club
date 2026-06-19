import { useMemo } from 'react';
import * as THREE from 'three';
import { FOLIAGE } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { heightAt } from '../config/terrain';
import { makeRng, scatter, scaleCount } from '../utils/placement';
import ScatterLayer from './foliage/ScatterLayer';
import GrassField from './foliage/GrassField';

const ALL_TREES = [
  ...FOLIAGE.trees.common, ...FOLIAGE.trees.pine,
  ...FOLIAGE.trees.twisted, ...FOLIAGE.trees.dead,
];

/**
 * The handcrafted-feeling forest: ground disc + scattered trees, bushes,
 * flowers, ferns, mushrooms, rocks, pebbles, and instanced grass. Everything
 * is seeded so placement is deterministic but looks random.
 */
export default function ForestEnvironment({ lowPerf = false }: { lowPerf?: boolean }) {
  const c = WORLD.counts;
  const hole = WORLD.workshopClearRadius;
  const [wx, , wz] = WORLD.workshopPosition;
  const [px, , pz] = WORLD.pond.center;
  const pondAvoid = { x: px, z: pz, r: WORLD.pond.radius + 1.5 };
  const avoid = [{ x: wx, z: wz, r: hole }, pondAvoid];

  /** Lush undergrowth palette — mostly green with teal/lime/pink/gold accents. */
  const UNDERGROWTH_TINTS = [
    '#5a8f3c', '#6fae4a', '#3f8f6e', '#4fb39a',
    '#9ad14e', '#d98ab0', '#e6b54e', '#7bc77e',
  ];

  // Separate RNG streams per layer so adding/removing one doesn't reshuffle others.
  const layers = useMemo(() => {
    const trees = ALL_TREES;
    return {
      trees: {
        models: trees,
        placements: scatter({
          count: scaleCount(c.trees, lowPerf), models: trees.length,
          rng: makeRng(WORLD.seed + 1), innerHole: hole + 2, radius: WORLD.groundRadius - 6,
          minScale: 1.1, maxScale: 2.4, avoid,
        }),
      },
      // dense, larger ring far out — gives the forest depth / a visible "wall"
      bgTrees: {
        models: trees,
        placements: scatter({
          count: scaleCount(c.bgTrees, lowPerf), models: trees.length,
          rng: makeRng(WORLD.seed + 11), innerHole: WORLD.groundRadius * 0.62,
          radius: WORLD.groundRadius * 1.08, minScale: 2.2, maxScale: 4.2, avoid,
        }),
      },
      bushes: {
        models: FOLIAGE.bushes,
        placements: scatter({
          count: scaleCount(c.bushes, lowPerf), models: FOLIAGE.bushes.length,
          rng: makeRng(WORLD.seed + 2), innerHole: hole, minScale: 0.8, maxScale: 1.6, avoid,
        }),
      },
      // dense low leafy cover spread right up to the workshop skirt — the "lush" floor
      undergrowth: {
        models: FOLIAGE.undergrowth,
        placements: scatter({
          count: scaleCount(c.undergrowth, lowPerf), models: FOLIAGE.undergrowth.length,
          rng: makeRng(WORLD.seed + 9), innerHole: hole - 4,
          radius: WORLD.groundRadius - 4, minScale: 0.7, maxScale: 1.7, avoid,
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

      <ScatterLayer models={layers.bgTrees.models} placements={layers.bgTrees.placements}
        wind={{ strength: 0.08, pivot: 6 }} castShadow={false} />
      <ScatterLayer models={layers.trees.models} placements={layers.trees.placements}
        wind={{ strength: 0.12, pivot: 4.5 }} castShadow />
      <ScatterLayer models={layers.bushes.models} placements={layers.bushes.placements}
        wind={{ strength: 0.22, pivot: 1.2 }} castShadow />
      <ScatterLayer models={layers.undergrowth.models} placements={layers.undergrowth.placements}
        wind={{ strength: 0.28, pivot: 0.9 }} castShadow={false} tints={UNDERGROWTH_TINTS} />
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

      {/* Layered grass species for a dense, varied lawn that hugs the terrain. */}
      {FOLIAGE.grassSpecies.map((m, i) => (
        <GrassField
          key={m}
          model={m}
          seedOffset={i + 1}
          count={scaleCount(Math.round(c.grass / FOLIAGE.grassSpecies.length), lowPerf)}
          avoid={[pondAvoid]}
        />
      ))}
    </group>
  );
}

/** Rolling stylized terrain — a displaced grid sampled from the height field,
 *  flat under the workshop, gently hilly beyond, darkening into the distance. */
function Ground() {
  const geometry = useMemo(() => {
    const size = WORLD.groundRadius * 2.3;
    const seg = 130;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2); // lay flat in XZ, y up
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#5d7c3f', roughness: 1, metalness: 0 });
    mat.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vDist;\nvarying float vH;')
        .replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvDist = length(position.xz);\nvH = position.y;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vDist;\nvarying float vH;')
        .replace('#include <dithering_fragment>',
          `#include <dithering_fragment>
          // tint hilltops lighter, hollows darker; darken toward the horizon
          gl_FragColor.rgb *= 1.0 + clamp(vH, -1.0, 2.0) * 0.05;
          float edge = smoothstep(${(WORLD.groundRadius * 0.4).toFixed(1)}, ${(WORLD.groundRadius * 1.1).toFixed(1)}, vDist);
          gl_FragColor.rgb *= mix(1.0, 0.5, edge);`);
    };
    return mat;
  }, []);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}
