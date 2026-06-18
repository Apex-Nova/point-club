# Point Club — Phase 1 Asset Acquisition List
## What to download, where to get it, and exactly where to put it

**How to use this doc:**
1. Download each item from the linked source (all are **free**; nearly all **CC0** = no attribution needed, commercial-OK).
2. Rename the file to the **exact target filename** shown.
3. Drop it into the **exact target path** shown (folders already exist in the repo).
4. When a category is filled, tell me and I'll wire it into the world. The code already expects these paths via the asset manifest.

> ⭐ = highest priority (scene needs it to look right). The rest can phase in.
> All `.glb` should be exported/kept as **glTF binary**. poly.pizza lets you download any model directly as `.glb`.

---

## 🌍 ONE PACK COVERS MOST OF THE FOREST (do this first) ⭐

**Quaternius — Stylized Nature MegaKit (CC0):** 110+ models — 40 trees, 35 plants/flowers, 27 rocks, grass, bushes.
- Download (whole pack): https://quaternius.com/packs/stylizednaturemegakit.html  → grab the **glTF** version
- Or pick individual GLBs à la carte: https://poly.pizza/bundle/Stylized-Nature-MegaKit-T34GZFA0fm
- Also useful (seamless textures + normals): **Ultimate Stylized Nature Pack** — https://quaternius.com/packs/ultimatestylizednature.html

From that one pack you can fill trees, bushes, flowers, rocks, and grass below. Pick the specific models I list and rename them.

---

## 1. Foliage — Trees  → `public/assets/foliage/trees/`

| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `tree_hero.glb` | The biggest, most beautiful tree in the pack (will be our landmark Hero Tree). A large oak/broadleaf with a full canopy. | Quaternius MegaKit (pick the tallest tree) |
| ⭐ `tree_a.glb` | A medium broadleaf tree | Quaternius MegaKit |
| ⭐ `tree_b.glb` | A different-shaped tree (pine/birch) for variety | Quaternius MegaKit |
| `tree_c.glb` | A third tree variant | Quaternius MegaKit |
| `stump.glb` | A tree stump or fallen log | Quaternius MegaKit |

> If a tree comes as separate "trunk" + "leaves/foliage" meshes, keep them together in one GLB — I'll drive the leaf part with the wind shader.

## 2. Foliage — Bushes  → `public/assets/foliage/bushes/`

| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `bush_a.glb` | A rounded leafy bush | Quaternius MegaKit |
| `bush_b.glb` | A second bush shape | Quaternius MegaKit |

## 3. Foliage — Grass  → `public/assets/foliage/grass/`

| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `grass_tuft.glb` | A single grass clump/tuft (we instance it thousands of times with a wind shader) | Quaternius MegaKit |
| `grass_blade_alpha.png` | (Optional alt) A transparent grass-blade card texture, if you prefer card grass | https://kenney.nl/assets/foliage-pack or search "grass blade alpha png" |

## 4. Foliage — Flowers  → `public/assets/foliage/flowers/`

| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `flower_a.glb` | A bright simple flower | Quaternius MegaKit |
| `flower_b.glb` | A second flower species/color | Quaternius MegaKit |
| `flower_c.glb` | A third flower | Quaternius MegaKit |

## 5. Rocks  → `public/assets/rocks/`

| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `rock_a.glb` | A medium boulder | Quaternius MegaKit |
| ⭐ `rock_b.glb` | A different rock shape | Quaternius MegaKit |
| `rock_small.glb` | A small rock/pebble cluster | Quaternius MegaKit |

---

## 6. Environment — Sky  → `public/assets/environment/skybox/`

| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `sky.hdr` | A warm golden-hour / partly-cloudy sky HDRI. Recommended: **Belfast Sunset (Pure Sky)** or browse the sunrise-sunset set. Download the **2K .hdr** (don't grab 16K — too heavy for web). | https://polyhaven.com/a/belfast_sunset_puresky · browse: https://polyhaven.com/hdris/sunrise-sunset |

> This single HDRI gives us the sky backdrop **and** realistic image-based lighting/reflections on the copper golem later. 2K is the sweet spot for web.

---

## 7. Workshop / Canvas / Props

### Canvas  → `public/assets/canvas/`
| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `easel.glb` | A wooden artist easel | poly.pizza search "easel": https://poly.pizza/search/easel · or Sketchfab (filter Downloadable + CC) |
| `frame.glb` | A wooden picture frame (for finished paintings) | https://poly.pizza/search/frame |

> The **giant blank canvas surface itself** I'll build as a simple framed plane in code (it has to be a live paint target later) — you don't need to source that.

### Props  → `public/assets/props/`
| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `palette.glb` | An artist's paint palette | https://poly.pizza/search/palette |
| ⭐ `paint_bucket.glb` | A paint bucket / can | https://poly.pizza/search/bucket |
| ⭐ `brush.glb` | A paintbrush | https://poly.pizza/search/paintbrush |
| `workbench.glb` | A rustic wooden workbench / table | https://poly.pizza/search/workbench |
| `stool.glb` | A wooden stool | https://poly.pizza/search/stool |
| `lantern.glb` | A hanging/standing lantern (we'll make it glow) | https://poly.pizza/search/lantern |
| `crate.glb` | A wooden crate / barrel (color storage) | https://poly.pizza/search/crate |
| `sketchbook.glb` | A book / paper scroll for clutter (story-telling) | https://poly.pizza/search/book |

> **Wooden platform** for the workshop floor I'll build in code (simple) unless you find a nice one — then name it `platform.glb` in this folder.

---

## 8. Effects — Holi Powder  → `public/assets/effects/`

The powder is colored **in the shader**, so the textures should be **white/grayscale soft puffs** (we tint them green/yellow/pink/blue/orange in code).

| Target filename | What to grab | Source |
|---|---|---|
| ⭐ `particles/` (several PNGs) | Kenney **Particle Pack** (80 soft white smoke/dust/cloud sprites). Drop the whole `PNG (Transparent)` set in here; I'll pick the soft round ones. | https://kenney.nl/assets/particle-pack |
| ⭐ `particles/` also | Kenney **Smoke Particles** (70 billowing smoke PNGs) — even better for drifting powder clouds. | https://kenney.nl/assets/smoke-particles |
| `flipbooks/smoke_sheet.png` | (Optional) An animated smoke **flipbook/sprite-sheet** for richer billowing. | search "smoke flipbook sprite sheet free" / OpenGameArt |

> You don't need to recolor anything — just give me the white puffs. Minimum viable: **one** soft round white smoke PNG named `particles/powder_soft.png`.

---

## 9. Audio  → `public/assets/audio/`

All loop/seamless where noted. Freesound: filter license to **CC0**. Pixabay: no attribution needed.

| Target path | What to grab | Source |
|---|---|---|
| ⭐ `ambient/forest_loop.mp3` | A seamless forest ambience (birds, soft wind). | Freesound "Forest Ambient LOOP" by Imjeax: https://freesound.org/people/Imjeax/sounds/427400/ · or Pixabay: https://pixabay.com/sound-effects/search/forest%20ambience/ |
| ⭐ `sfx/powder_poof.mp3` | A soft poof/whoosh for powder drift. | Freesound "Cloud Poof" by qubodup: https://freesound.org/people/qubodup/sounds/714258/ |
| `sfx/ui_click.mp3` | Soft UI click/tap. | Kenney Audio (CC0): https://kenney.nl/assets/interface-sounds |
| `sfx/brush_stroke.mp3` | A brush/paint stroke foley (for later). | Freesound search "paint brush" (CC0) · https://freesound.org |
| `music/ambient_bed.mp3` | (Optional) soft whimsical loop. | Pixabay Music: https://pixabay.com/music/ |

---

## 10. UI Decoration (lightweight — most UI is code/SVG)  → `public/assets/ui/`

| Target path | What to grab | Source |
|---|---|---|
| `frames/` | (Optional) wood/leaf 9-slice UI frame PNGs. | Kenney UI packs: https://kenney.nl/assets?q=ui · itch.io GUI kits |
| icons | Already covered in-code by **Lucide** (installed). No download needed. | — |
| logo/font | Brand design — separate task, not blocking Phase 1. | — |

---

## Minimum set to make Phase 1 look great (if you only grab a few) ⭐
1. **Quaternius Stylized Nature MegaKit** → fills trees, bushes, flowers, rocks, grass (items 1–5).
2. **Poly Haven `sky.hdr`** (2K) → sky + lighting (item 6).
3. **easel.glb + palette.glb + paint_bucket.glb + brush.glb** from poly.pizza → workshop story (item 7).
4. **Kenney Particle/Smoke PNGs** → Holi powder (item 8).
5. **forest_loop.mp3 + powder_poof.mp3** → atmosphere audio (item 9).

With just those five, the forest, hero tree, workshop, powder, and ambience all come alive.

---

## Folder map (already created in the repo)
```
public/assets/
├── foliage/trees/      tree_hero.glb, tree_a.glb, tree_b.glb, tree_c.glb, stump.glb
├── foliage/bushes/     bush_a.glb, bush_b.glb
├── foliage/grass/      grass_tuft.glb
├── foliage/flowers/    flower_a.glb, flower_b.glb, flower_c.glb
├── rocks/              rock_a.glb, rock_b.glb, rock_small.glb
├── environment/skybox/ sky.hdr
├── canvas/             easel.glb, frame.glb
├── props/              palette.glb, paint_bucket.glb, brush.glb, workbench.glb,
│                       stool.glb, lantern.glb, crate.glb, sketchbook.glb
├── effects/particles/  (Kenney white smoke/dust PNGs)
├── effects/flipbooks/  smoke_sheet.png (optional)
├── audio/ambient/      forest_loop.mp3
├── audio/sfx/          powder_poof.mp3, ui_click.mp3, brush_stroke.mp3
└── audio/music/        ambient_bed.mp3 (optional)
```

---

### Licensing note
Quaternius, Kenney, and Poly Haven are all **CC0** (public domain — use freely, commercially, no credit required). For **Freesound**, set the license filter to **CC0** to keep it attribution-free, or note the author if you pick a CC-BY sound (I'll keep a `/docs/licenses/` record either way).
