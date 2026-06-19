import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { FOLIAGE, KENNEY } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { heightAt } from '../config/terrain';
import { makeRng, scatter, scaleCount } from '../utils/placement';
import ScatterLayer from './foliage/ScatterLayer';
import GrassField from './foliage/GrassField';

const ALL_TREES = [
  ...FOLIAGE.trees.common, ...FOLIAGE.trees.pine,
  ...FOLIAGE.trees.twisted, ...FOLIAGE.trees.dead,
];
/** Conifers + common trees read best as the dense background wall. */
const WALL_TREES = [...FOLIAGE.trees.pine, ...FOLIAGE.trees.common, ...FOLIAGE.trees.twisted];

/** Undergrowth palette — mostly green with teal/lime/pink/gold accents. */
const UNDERGROWTH_TINTS = [
  '#5a8f3c', '#6fae4a', '#3f8f6e', '#4fb39a',
  '#9ad14e', '#d98ab0', '#e6b54e', '#7bc77e',
];

/**
 * A layered stylized-fantasy forest built as a BOWL: a low clearing for the
 * workshop ringed by rising, densely-forested rim on every side so there is no
 * empty horizon. Placement is organised foreground → midground → background and
 * draws on the full MegaKit vegetation library.
 */
export default function ForestEnvironment({ lowPerf = false }: { lowPerf?: boolean }) {
  const c = WORLD.counts;
  const hole = WORLD.workshopClearRadius;
  const R = WORLD.groundRadius;
  const [wx, , wz] = WORLD.workshopPosition;
  const [px, , pz] = WORLD.pond.center;
  const pondAvoid = { x: px, z: pz, r: WORLD.pond.radius + 1.5 };
  const avoid = [{ x: wx, z: wz, r: hole }, pondAvoid];

  const layers = useMemo(() => {
    const mk = (
      seed: number, models: string[], count: number,
      innerHole: number, radius: number, minScale: number, maxScale: number,
    ) => ({
      models,
      placements: scatter({
        count: scaleCount(count, lowPerf), models: models.length,
        rng: makeRng(WORLD.seed + seed), innerHole, radius, minScale, maxScale, avoid,
      }),
    });

    return {
      // ── BACKGROUND: dense forest wall on the rising bowl rim ──
      // Kenney conifers form the cohesive wall; MegaKit trees add variety behind.
      kenneyPines: mk(20, KENNEY.pines, 84, R * 0.5, R * 1.12, 4.0, 7.5),
      bgTrees:  mk(11, WALL_TREES, 56, R * 0.62, R * 1.12, 2.6, 4.8),
      // ── MIDGROUND: trees, saplings, bushes, rocks ──
      trees:    mk(1, ALL_TREES, c.trees, hole + 2, R * 0.72, 1.1, 2.4),
      kenneyTrees: mk(21, KENNEY.trees, 46, hole + 2, R * 0.72, 3.2, 5.5),
      saplings: mk(8, ALL_TREES, c.saplings, hole, R * 0.5, 0.5, 1.0),
      bushes:   mk(2, FOLIAGE.bushes, c.bushes, hole - 1, R * 0.8, 0.8, 1.7),
      kenneyBushes: mk(22, KENNEY.bushes, 70, hole - 2, R * 0.7, 2.5, 4.5),
      rocks:    mk(6, FOLIAGE.rocks, c.rocks, hole - 2, R * 0.85, 0.6, 2.0),
      logs:     mk(23, KENNEY.logs, 16, hole, R * 0.6, 2.0, 4.0),
      // ── FOREGROUND: dense floor cover ──
      undergrowth: mk(9, FOLIAGE.undergrowth, c.undergrowth, hole - 4, R - 4, 0.7, 1.7),
      ferns:    mk(4, FOLIAGE.ferns, c.ferns, hole, R * 0.75, 0.8, 1.6),
      flowers:  mk(3, FOLIAGE.flowers, 130, hole - 3, R * 0.78, 0.7, 1.4),
      kenneyFlowers: mk(24, KENNEY.flowers, 150, hole - 5, R * 0.6, 2.0, 3.6),
      petals:   mk(14, FOLIAGE.petals, c.petals, hole - 6, R * 0.5, 0.7, 1.5),
      mushrooms: mk(5, FOLIAGE.mushrooms, c.mushrooms, hole - 4, R * 0.7, 0.7, 1.4),
      pebbles:  mk(7, FOLIAGE.pebbles, c.pebbles, hole - 5, R * 0.6, 0.6, 1.4),
    };
  }, [c, hole, R, lowPerf, avoid]);

  return (
    <group name="ForestEnvironment">
      <Ground />
      <Path />

      {/* background → midground → foreground draw order */}
      <ScatterLayer models={layers.kenneyPines.models} placements={layers.kenneyPines.placements}
        wind={{ strength: 0.06, pivot: 5 }} castShadow={false} />
      <ScatterLayer models={layers.bgTrees.models} placements={layers.bgTrees.placements}
        wind={{ strength: 0.07, pivot: 6 }} castShadow={false} />
      <ScatterLayer models={layers.trees.models} placements={layers.trees.placements}
        wind={{ strength: 0.12, pivot: 4.5 }} castShadow />
      <ScatterLayer models={layers.kenneyTrees.models} placements={layers.kenneyTrees.placements}
        wind={{ strength: 0.12, pivot: 3.5 }} castShadow />
      <ScatterLayer models={layers.saplings.models} placements={layers.saplings.placements}
        wind={{ strength: 0.2, pivot: 1.6 }} castShadow />
      <ScatterLayer models={layers.bushes.models} placements={layers.bushes.placements}
        wind={{ strength: 0.22, pivot: 1.2 }} castShadow />
      <ScatterLayer models={layers.kenneyBushes.models} placements={layers.kenneyBushes.placements}
        wind={{ strength: 0.24, pivot: 0.8 }} castShadow={false} />
      <ScatterLayer models={layers.rocks.models} placements={layers.rocks.placements}
        wind={false} castShadow receiveShadow />
      <ScatterLayer models={layers.logs.models} placements={layers.logs.placements}
        wind={false} castShadow receiveShadow />
      <ScatterLayer models={layers.undergrowth.models} placements={layers.undergrowth.placements}
        wind={{ strength: 0.28, pivot: 0.9 }} castShadow={false} tints={UNDERGROWTH_TINTS} />
      <ScatterLayer models={layers.ferns.models} placements={layers.ferns.placements}
        wind={{ strength: 0.3, pivot: 0.8 }} castShadow={false} />
      <ScatterLayer models={layers.flowers.models} placements={layers.flowers.placements}
        wind={{ strength: 0.35, pivot: 0.5 }} castShadow={false} />
      <ScatterLayer models={layers.kenneyFlowers.models} placements={layers.kenneyFlowers.placements}
        wind={{ strength: 0.38, pivot: 0.4 }} castShadow={false} />
      <ScatterLayer models={layers.petals.models} placements={layers.petals.placements}
        wind={{ strength: 0.4, pivot: 0.3 }} castShadow={false} />
      <ScatterLayer models={layers.mushrooms.models} placements={layers.mushrooms.placements}
        wind={false} castShadow />
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

/** A winding stepping-stone path leading out of the clearing. */
function Path() {
  const gltfs = useGLTF(FOLIAGE.pathStones);
  const scenes = useMemo(() => (Array.isArray(gltfs) ? gltfs : [gltfs]).map(g => g.scene), [gltfs]);
  const [wx, , wz] = WORLD.workshopPosition;

  const stones = useMemo(() => {
    const rng = makeRng(WORLD.seed ^ 0x70a7c0de);
    const out: { pos: [number, number, number]; rot: number; scl: number; idx: number }[] = [];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // S-curve heading out toward +z/-x from the workshop edge
      const dist = WORLD.workshopClearRadius - 1 + t * 26;
      const sway = Math.sin(t * Math.PI * 2.2) * 4;
      const x = wx - dist * 0.5 + sway;
      const z = wz + dist * 0.86;
      out.push({
        pos: [x, heightAt(x, z) + 0.02, z],
        rot: rng() * Math.PI, scl: 0.7 + rng() * 0.6, idx: i % scenes.length,
      });
    }
    return out;
  }, [scenes.length, wx, wz]);

  return (
    <group>
      {stones.map((s, i) => {
        const src = scenes[s.idx];
        if (!src) return null;
        return <primitive key={i} object={src.clone(true)} position={s.pos} rotation={[0, s.rot, 0]} scale={s.scl} />;
      })}
    </group>
  );
}

/** Stylized terrain — displaced grid sampled from the bowl height field. */
function Ground() {
  const geometry = useMemo(() => {
    const size = WORLD.groundRadius * 2.4;
    const seg = 170;
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
          // hilltops lighter, hollows darker; deepen the rim into shadow
          gl_FragColor.rgb *= 1.0 + clamp(vH, -1.0, 6.0) * 0.03;
          float edge = smoothstep(${(WORLD.groundRadius * 0.5).toFixed(1)}, ${(WORLD.groundRadius * 1.15).toFixed(1)}, vDist);
          gl_FragColor.rgb *= mix(1.0, 0.45, edge);`);
    };
    return mat;
  }, []);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}
