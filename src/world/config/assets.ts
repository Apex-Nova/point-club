/**
 * Asset manifest — single source of truth for every file path the world loads.
 * Swap a path here and the whole scene picks it up. Built to expand.
 */

const BASE = '/assets';
const KIT = `${BASE}/foliage/megakit`; // Quaternius Stylized Nature MegaKit (CC0)
const NK = `${BASE}/foliage/kenney`;   // Kenney Nature Kit (CC0)

/**
 * Kenney Nature Kit — cohesive low-poly set. Native models are small
 * (~1.2–1.7u trees), so these get larger scatter scales than the MegaKit.
 */
export const KENNEY = {
  /** Tall conifers — ideal for the dense background forest wall. */
  pines: [
    'tree_pineTallA', 'tree_pineTallB', 'tree_pineTallC', 'tree_pineTallD',
    'tree_pineTallA_detailed', 'tree_pineTallB_detailed', 'tree_pineTallC_detailed',
    'tree_pineRoundA', 'tree_pineRoundB', 'tree_pineRoundC', 'tree_pineRoundD',
    'tree_pineRoundE', 'tree_pineRoundF', 'tree_pineDefaultA', 'tree_pineDefaultB',
  ].map(n => `${NK}/${n}.glb`),
  /** Broadleaf + autumn-coloured trees for midground variety. */
  trees: [
    'tree_oak', 'tree_default', 'tree_detailed', 'tree_fat', 'tree_tall', 'tree_thin',
    'tree_simple', 'tree_cone', 'tree_oak_fall', 'tree_default_fall', 'tree_detailed_fall',
    'tree_tall_fall', 'tree_simple_fall', 'tree_plateau',
  ].map(n => `${NK}/${n}.glb`),
  /** Bright flowers (purple/red/yellow ×3). */
  flowers: [
    'flower_purpleA', 'flower_purpleB', 'flower_purpleC',
    'flower_redA', 'flower_redB', 'flower_redC',
    'flower_yellowA', 'flower_yellowB', 'flower_yellowC',
  ].map(n => `${NK}/${n}.glb`),
  /** Leafy bushes/plants for undergrowth. */
  bushes: [
    'plant_bush', 'plant_bushDetailed', 'plant_bushLarge',
    'plant_bushSmall', 'plant_bushTriangle', 'plant_bushLargeTriangle',
  ].map(n => `${NK}/${n}.glb`),
  /** Fallen logs / stacks for ground storytelling. */
  logs: ['log', 'log_large', 'log_stack', 'log_stackLarge'].map(n => `${NK}/${n}.glb`),
} as const;

/** Foliage GLTF models grouped by role. Filenames match the MegaKit. */
export const FOLIAGE = {
  trees: {
    common: [1, 2, 3, 4, 5].map(n => `${KIT}/CommonTree_${n}.gltf`),
    pine: [1, 2, 3, 4, 5].map(n => `${KIT}/Pine_${n}.gltf`),
    twisted: [1, 2, 3, 4, 5].map(n => `${KIT}/TwistedTree_${n}.gltf`),
    dead: [1, 2, 3, 4, 5].map(n => `${KIT}/DeadTree_${n}.gltf`),
  },
  /** The signature landmark — biggest, fullest canopy. */
  heroTree: `${KIT}/CommonTree_5.gltf`,
  bushes: [`${KIT}/Bush_Common.gltf`, `${KIT}/Bush_Common_Flowers.gltf`],
  flowers: [
    `${KIT}/Flower_3_Group.gltf`,
    `${KIT}/Flower_4_Group.gltf`,
    `${KIT}/Flower_3_Single.gltf`,
    `${KIT}/Flower_4_Single.gltf`,
    `${KIT}/Clover_1.gltf`,
    `${KIT}/Clover_2.gltf`,
  ],
  /** Tiny ground petals/clover for the densest foreground detail. */
  petals: [1, 2, 3, 4, 5].map(n => `${KIT}/Petal_${n}.gltf`),
  /** Stepping-stone path pieces (round + square). */
  pathStones: [
    `${KIT}/RockPath_Round_Wide.gltf`, `${KIT}/RockPath_Round_Thin.gltf`,
    `${KIT}/RockPath_Round_Small_1.gltf`, `${KIT}/RockPath_Round_Small_2.gltf`,
    `${KIT}/RockPath_Round_Small_3.gltf`,
  ],
  ferns: [`${KIT}/Fern_1.gltf`, `${KIT}/Plant_1.gltf`, `${KIT}/Plant_7.gltf`],
  /** Dense, leafy low undergrowth — fills the floor for the lush jungle look. */
  undergrowth: [
    `${KIT}/Plant_1.gltf`, `${KIT}/Plant_1_Big.gltf`,
    `${KIT}/Plant_7.gltf`, `${KIT}/Plant_7_Big.gltf`,
    `${KIT}/Fern_1.gltf`, `${KIT}/Bush_Common.gltf`, `${KIT}/Bush_Common_Flowers.gltf`,
  ],
  mushrooms: [`${KIT}/Mushroom_Common.gltf`, `${KIT}/Mushroom_Laetiporus.gltf`],
  rocks: [`${KIT}/Rock_Medium_1.gltf`, `${KIT}/Rock_Medium_2.gltf`, `${KIT}/Rock_Medium_3.gltf`],
  pebbles: [
    ...[1, 2, 3, 4, 5].map(n => `${KIT}/Pebble_Round_${n}.gltf`),
    ...[1, 2, 3, 4, 5, 6].map(n => `${KIT}/Pebble_Square_${n}.gltf`),
  ],
  /** Single-mesh grass tuft — used for instancing. */
  grass: `${KIT}/Grass_Common_Tall.gltf`,
  /** Grass species for layered, varied instanced ground cover. */
  grassSpecies: [
    `${KIT}/Grass_Common_Tall.gltf`,
    `${KIT}/Grass_Common_Short.gltf`,
    `${KIT}/Grass_Wispy_Tall.gltf`,
    `${KIT}/Grass_Wispy_Short.gltf`,
  ],
} as const;

/** Workshop props (poly.pizza CC0). Easel + canvas are built in code. */
export const PROPS = {
  workbench: `${BASE}/props/workbench.glb`,
  palette: `${BASE}/props/palette.glb`,
  paintBucket: `${BASE}/props/paint_bucket.glb`,
  brush: `${BASE}/props/brush.glb`,
} as const;

export const CHARACTERS = {
  copperGolem: `${BASE}/characters/copper_golem.glb`,
} as const;

/** Ambient wildlife (CC0). Birds are static meshes flown procedurally; the
 *  butterflies and fish carry their own baked animation clips. */
export const FAUNA = {
  birds: [`${BASE}/characters/birds/parrot.glb`, `${BASE}/characters/birds/hummingbird.glb`],
  /** Single rigged butterfly (Flying/Idle clips) — scattered as individuals. */
  butterfly: `${BASE}/characters/butterflies/butterfly_single.glb`,
  fish: [
    `${BASE}/characters/fish/fish_a.glb`,
    `${BASE}/characters/fish/fish_b.glb`,
    `${BASE}/characters/fish/fish_c.glb`,
  ],
} as const;

export const ENVIRONMENT = {
  skyHdr: `${BASE}/environment/skybox/sky.hdr`,
  waterfall: `${BASE}/environment/waterfall/waterfall.glb`,
} as const;

export const EFFECTS = {
  powderPuffs: [
    `${BASE}/effects/particles/powder_puff_01.png`,
    `${BASE}/effects/particles/powder_puff_02.png`,
    `${BASE}/effects/particles/powder_puff_03.png`,
  ],
  powderSoft: `${BASE}/effects/particles/powder_soft.png`,
} as const;

export const AUDIO = {
  forestLoop: `${BASE}/audio/ambient/forest_loop.mp3`,
  powderPoof: `${BASE}/audio/sfx/powder_poof.mp3`,
} as const;

/** Flat list of every GLTF the scene mounts — used for preloading. */
export const ALL_FOLIAGE_MODELS: string[] = [
  ...FOLIAGE.trees.common,
  ...FOLIAGE.trees.pine,
  ...FOLIAGE.trees.twisted,
  ...FOLIAGE.trees.dead,
  FOLIAGE.heroTree,
  ...FOLIAGE.bushes,
  ...FOLIAGE.flowers,
  ...FOLIAGE.ferns,
  ...FOLIAGE.mushrooms,
  ...FOLIAGE.rocks,
  ...FOLIAGE.pebbles,
  FOLIAGE.grass,
];

export const ALL_PROP_MODELS: string[] = Object.values(PROPS);
