import * as THREE from 'three';

/* ── Copper Golem palette ────────────────────────────────────── */
export const COPPER       = '#c8743f';  // bright unoxidised copper
export const COPPER_LIGHT = '#e09464';
export const COPPER_DARK  = '#9a4f28';
export const PATINA       = '#54a890';  // oxidised copper green
export const PATINA_LIGHT = '#7cc7b2';
export const EYE          = '#ffe6a3';  // warm glowing eye
export const EYE_CORE     = '#fff6df';

/* ── Forest / studio palette (matches Phase 1) ───────────────── */
export const LEAF    = '#2f7d3e';
export const LEAF_D  = '#205c2c';
export const GRASS   = '#5aa84b';
export const BARK    = '#8a5a36';
export const BARK_D  = '#6f4527';
export const WOOD    = '#b07a45';
export const WOOD_D  = '#8a5c30';
export const STONE   = '#9a958c';
export const STONE_D = '#76726a';
export const CREAM   = '#fbf6e9';
export const SUN     = '#ffcf5c';

/* ── Holi festival pigment colours ───────────────────────────── */
export const HOLI = ['#4cc66b', '#48b8ff', '#ffd23f', '#ff8c42', '#ff5d8f'];
export const holiColor = () => HOLI[(Math.random() * HOLI.length) | 0];

/* Layout anchors shared across components (world units) */
export const CANVAS_CENTER = new THREE.Vector3(0, 2.2, -2.2);
export const CANVAS_W = 6.4;
export const CANVAS_H = 4.0;
export const PLATFORM_Y = -1.5;          // top surface of the wooden platform
export const GOLEM_BASE_Y = PLATFORM_Y;  // feet rest here
