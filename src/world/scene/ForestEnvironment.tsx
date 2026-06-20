import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { FOLIAGE, USN_COLLECTIONS } from '../config/assets';
import { WORLD } from '../config/worldConfig';
import { heightAt } from '../config/terrain';
import { makeRng, scatter, scaleCount } from '../utils/placement';
import InstancedScatter from './foliage/InstancedScatter';
import CollectionScatter from './foliage/CollectionScatter';
import GrassField from './foliage/GrassField';

const U = USN_COLLECTIONS;
/** Quaternius USN tree collections combined into the forest pools. */
const USN_WALL = [U.pines, U.trees, U.birch, U.maple];
const USN_MID = [U.trees, U.birch, U.maple, U.dead, U.pines];

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
  // Keep a clear viewing bubble around the camera's resting spot (+z) so near
  // foliage frames the shot instead of blocking the lens.
  const camClear = { x: wx, z: wz + 17, r: 8 };
  const avoid = [{ x: wx, z: wz, r: hole }, pondAvoid, camClear];

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
      // ── BACKGROUND: cheap MegaKit forest wall (backbone) + USN accents ──
      usnWall:  mk(20, USN_WALL, 34, R * 0.5, R * 1.12, 0.85, 1.5),
      bgTrees:  mk(11, WALL_TREES, 72, R * 0.6, R * 1.12, 2.6, 4.8),
      // ── MIDGROUND: trees, saplings, bushes, rocks ──
      usnMid:   mk(21, USN_MID, 22, hole + 2, R * 0.72, 0.7, 1.2),
      trees:    mk(1, ALL_TREES, 44, hole + 2, R * 0.72, 1.1, 2.4),
      saplings: mk(8, USN_MID, 14, hole, R * 0.5, 0.35, 0.6),
      bushes:   mk(2, FOLIAGE.bushes, c.bushes, hole - 1, R * 0.8, 0.8, 1.7),
      usnBushes: mk(22, [U.bushes, U.flowerBushes], 46, hole - 2, R * 0.7, 0.7, 1.5),
      rocks:    mk(6, FOLIAGE.rocks, c.rocks, hole - 2, R * 0.85, 0.6, 2.0),
      usnRocks: mk(23, [U.rocks], 16, hole, R * 0.85, 0.7, 1.8),
      // ── FOREGROUND: dense floor cover ──
      undergrowth: mk(9, FOLIAGE.undergrowth, c.undergrowth, hole - 4, R - 4, 0.7, 1.7),
      ferns:    mk(4, FOLIAGE.ferns, c.ferns, hole, R * 0.75, 0.8, 1.6),
      flowers:  mk(3, FOLIAGE.flowers, 90, hole - 3, R * 0.78, 0.7, 1.4),
      usnFlowers: mk(24, [U.flowers], 90, hole - 5, R * 0.6, 0.7, 1.4),
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
      <CollectionScatter collections={USN_WALL} placements={layers.usnWall.placements}
        targetHeight={9} wind={{ strength: 0.06, pivot: 5 }} castShadow={false} />
      <InstancedScatter models={layers.bgTrees.models} placements={layers.bgTrees.placements}
        wind={{ strength: 0.07, pivot: 6 }} />
      <CollectionScatter collections={USN_MID} placements={layers.usnMid.placements}
        targetHeight={6} wind={{ strength: 0.12, pivot: 3.5 }} castShadow={false} />
      <InstancedScatter models={layers.trees.models} placements={layers.trees.placements}
        wind={{ strength: 0.12, pivot: 4.5 }} />
      <CollectionScatter collections={USN_MID} placements={layers.saplings.placements}
        targetHeight={6} wind={{ strength: 0.2, pivot: 1.6 }} castShadow={false} />
      <InstancedScatter models={layers.bushes.models} placements={layers.bushes.placements}
        wind={{ strength: 0.22, pivot: 1.2 }} />
      <CollectionScatter collections={[U.bushes, U.flowerBushes]} placements={layers.usnBushes.placements}
        targetHeight={1.1} wind={{ strength: 0.24, pivot: 0.8 }} castShadow={false} />
      <InstancedScatter models={layers.rocks.models} placements={layers.rocks.placements}
        wind={false} receiveShadow />
      <CollectionScatter collections={[U.rocks]} placements={layers.usnRocks.placements}
        targetHeight={1.6} wind={false} castShadow={false} receiveShadow />
      <InstancedScatter models={layers.undergrowth.models} placements={layers.undergrowth.placements}
        wind={{ strength: 0.28, pivot: 0.9 }} />
      <InstancedScatter models={layers.ferns.models} placements={layers.ferns.placements}
        wind={{ strength: 0.3, pivot: 0.8 }} />
      <InstancedScatter models={layers.flowers.models} placements={layers.flowers.placements}
        wind={{ strength: 0.35, pivot: 0.5 }} />
      <CollectionScatter collections={[U.flowers]} placements={layers.usnFlowers.placements}
        targetHeight={0.6} wind={{ strength: 0.38, pivot: 0.4 }} castShadow={false} />
      <InstancedScatter models={layers.petals.models} placements={layers.petals.placements}
        wind={{ strength: 0.4, pivot: 0.3 }} />
      <InstancedScatter models={layers.mushrooms.models} placements={layers.mushrooms.placements}
        wind={false} />
      <InstancedScatter models={layers.pebbles.models} placements={layers.pebbles.placements}
        wind={false} receiveShadow />

      {/* Layered grass species — comes right up to the platform mound base so
          there's no bare ring / floating look around the deck. */}
      {FOLIAGE.grassSpecies.map((m, i) => (
        <GrassField
          key={m}
          model={m}
          seedOffset={i + 1}
          innerHole={6.4}
          count={scaleCount(Math.round(c.grass / FOLIAGE.grassSpecies.length), lowPerf)}
          avoid={[pondAvoid, camClear]}
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
    const mat = new THREE.MeshStandardMaterial({ color: '#5f8a40', roughness: 1, metalness: 0 });
    mat.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vDist;\nvarying float vH;\nvarying vec2 vXZ;')
        .replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvDist = length(position.xz);\nvH = position.y;\nvXZ = position.xz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          varying float vDist; varying float vH; varying vec2 vXZ;
          // cheap value-noise for a painterly dirt/moss/grass blend
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }`)
        .replace('#include <dithering_fragment>',
          `#include <dithering_fragment>
          // painterly forest floor: grass ↔ moss ↔ dirt, broken up by noise
          vec3 grass = vec3(0.36, 0.52, 0.24);
          vec3 moss  = vec3(0.28, 0.42, 0.20);
          vec3 dirt  = vec3(0.42, 0.33, 0.21);
          float n  = vnoise(vXZ * 0.18);
          float n2 = vnoise(vXZ * 0.7 + 11.3);
          vec3 floorCol = mix(moss, grass, smoothstep(0.35, 0.75, n));
          floorCol = mix(floorCol, dirt, smoothstep(0.62, 0.92, n2) * 0.5);     // patches of bare earth
          floorCol *= 0.92 + n2 * 0.16;                                          // fine variation
          gl_FragColor.rgb = mix(gl_FragColor.rgb, floorCol, 0.85);
          gl_FragColor.rgb *= 1.0 + clamp(vH, -1.0, 6.0) * 0.025;                // height shading
          float edge = smoothstep(${(WORLD.groundRadius * 0.5).toFixed(1)}, ${(WORLD.groundRadius * 1.15).toFixed(1)}, vDist);
          gl_FragColor.rgb *= mix(1.0, 0.55, edge);`);
    };
    return mat;
  }, []);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}
