# Point Club — Copper Golem Forest Homepage
## Production Asset Plan v1.0

**Owner:** Technical Art Director / Lead Environment Artist
**Status:** Pre-production — asset planning (no code)
**Target experience:** A premium interactive 3D homepage that plays like a small animated game — a living Copper Golem artist painting inside a stylized fantasy forest.

---

## 0. Art Direction North Star

| Pillar | Decision |
|---|---|
| **Style** | Stylized "storybook realism" — Ghibli/Pixar-leaning. Hand-painted-look textures, soft normals, gentle subsurface feel. NOT photoreal, NOT low-poly flat-shaded. |
| **Silhouette** | Rounded, friendly, chunky forms. Readable at small sizes (mobile). |
| **Palette** | Warm forest base (mossy greens `#2f7d3e`, bark browns `#5b4128`), copper/verdigris hero accents (`#b87333` copper, `#3fae8f` patina), festival pop colors for Holi (magenta, saffron, cyan, violet). |
| **Lighting** | Single warm key (golden-hour sun), cool sky fill, soft contact shadows. Bloom on highlights. |
| **Poly budget** | Hero ~25–40k tris; trees 1–3k each (instanced); grass/flowers via instancing/billboards. Total scene target < 250k visible tris on desktop, aggressive LOD/cull on mobile. |
| **Texture budget** | Hero 2K PBR set; environment shared 1K atlases; mobile downscale to 1K/512. |
| **Format** | All meshes delivered as **glTF/GLB** (Draco/Meshopt compressed). Textures KTX2/Basis where possible. |
| **Performance gate** | 60fps desktop mid-tier GPU; 30fps mobile with reduced scene. This governs every quantity below. |

---

## 1. Complete Asset Inventory

Legend — **Tier:** 🔴 Critical · 🟡 Important · 🟢 Optional · ⚪ Nice-to-have
**Style** column always implies: stylized, PBR, glTF-ready unless noted.

### 1.1 Characters

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Copper Golem (hero)** | 🔴 | The star — paints, idles, waves, reacts to cursor/click | `copper golem`, `stylized robot artist`, `automaton character rigged`, `clay golem` | Sketchfab (CC-BY/Store), Quixel, custom commission (Fiverr/ArtStation), Meshy/Tripo (AI gen base) | 1 (rigged) | Stylized, copper+verdigris PBR, ~30k tris, humanoid rig |
| Golem alt-skins | ⚪ | Seasonal/unlock variants | `golem skin variant`, `mossy robot` | Same model retextured | 2–3 | Recolor/material swaps only |
| Forest critter (companion) | 🟢 | Life — a bird/fox that reacts | `stylized fox rigged`, `low poly bird animated`, `cute forest animal glb` | Sketchfab, Quaternius (free) | 1 | Matches hero scale/style |
| Butterflies / fireflies | 🟡 | Ambient motion (often particle, not mesh) | `butterfly sprite`, `firefly particle` | Particle textures (see VFX) | n/a | Billboard sprites |

### 1.2 Environment (ground, sky, atmosphere)

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Ground / terrain mesh** | 🔴 | The clearing the golem stands on | `stylized forest ground`, `clearing terrain glb`, `hand painted terrain` | Custom (sculpt + paint), Quixel, Sketchfab | 1 | Sculpted dirt+moss, 1K tiling atlas |
| **Skybox / sky dome** | 🔴 | World backdrop, mood | `stylized sky HDRI`, `fantasy sky panorama`, `gradient sky dome` | Poly Haven (HDRI, free CC0), HDRIs, custom gradient shader | 1–2 | Golden-hour gradient, soft clouds |
| Distant background hills | 🟡 | Depth / parallax silhouette | `forest background card`, `mountain silhouette stylized` | Custom flat cards / matte | 2–4 layers | Flat painted cards |
| Volumetric god-rays plane | 🟢 | Sun shafts through trees | `light shaft texture`, `god ray plane` | Texture + additive plane | 2–3 | Soft additive |
| Ground detail decals | 🟢 | Break tiling (puddles, paint splats, moss) | `stylized decal moss`, `paint splat decal` | Quixel Decals, custom | 6–10 | Alpha decals |

### 1.3 Trees

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Hero foreground tree(s)** | 🔴 | Framing, canopy that catches light | `stylized tree glb`, `fantasy tree hand painted`, `cartoon oak tree` | Quaternius (free), Sketchfab, KitBash | 2–3 unique | 2–3k tris, alpha-card leaves |
| Mid-ground trees | 🟡 | Fill the grove, instanced | `stylized tree pack`, `low poly forest pack` | Quaternius Ultimate Nature (free), Synty | 4–6 unique → instanced ×20–40 | 1–2k tris |
| Background tree billboards | 🟡 | Cheap density at distance | `tree billboard`, `impostor tree atlas` | Generated impostors | 1 atlas | Billboard/impostor |
| Stumps / fallen logs | 🟢 | Props the golem can sit/lean on | `tree stump glb`, `fallen log stylized` | Quaternius, Sketchfab | 2–3 | Matches tree set |

### 1.4 Grass

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Grass blade cards** | 🔴 | Ground cover, wind motion | `stylized grass blade`, `grass card alpha`, `hand painted grass texture` | Custom alpha + instancing, Quaternius | 3–4 variants → instanced ×thousands | Alpha cards, wind shader |
| Grass clump meshes | 🟡 | Hero-area denser tufts | `grass clump glb`, `grass tuft low poly` | Quaternius, Sketchfab | 3–5 | Low tris, instanced |
| Ground cover texture | 🟡 | Base painted grass under instances | `hand painted grass tile` | Poly Haven, textures.com, custom | 1 atlas | Seamless 1K |

### 1.5 Flowers

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| Flower set | 🟡 | Color pops, charm, Holi tie-in | `stylized flower pack glb`, `low poly flowers`, `fantasy flower` | Quaternius, Sketchfab, Synty | 4–6 species | Instanced, bright |
| Glowing magic flowers | 🟢 | Fantasy accent, night/hover glow | `glowing flower`, `bioluminescent plant stylized` | Sketchfab, custom emissive | 2–3 | Emissive material |
| Petal scatter (VFX) | 🟢 | Falling petals ambiance | `petal particle`, `falling petals sprite` | Particle texture (see VFX) | n/a | Billboard particles |

### 1.6 Rocks

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| Rock set (small–large) | 🟡 | Set dressing, composition anchors | `stylized rock pack`, `hand painted rock glb`, `boulder low poly` | Quaternius, Quixel (stylize), Sketchfab | 5–8 | Shared 1K atlas, instanced |
| Pebbles / gravel | 🟢 | Ground detail near workshop | `pebble pack glb`, `small stones low poly` | Quaternius | 3–5 | Tiny, instanced |
| Mossy hero rock | 🟢 | Feature stone / seat | `mossy boulder stylized` | Sketchfab, custom | 1 | Moss blend material |

### 1.7 Canvas (the drawing surface — core gameplay object)

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Easel** | 🔴 | Holds the canvas the golem paints | `wooden easel glb`, `artist easel low poly`, `painting stand` | Sketchfab, Quaternius props, custom | 1 | Weathered wood, stylized |
| **Canvas board (paintable)** | 🔴 | The live drawing surface (dynamic texture target) | `blank canvas glb`, `painting canvas frame` | Custom (simple quad + frame) | 1 | Flat plane w/ frame, dynamic texture slot |
| Finished painting frames | 🟢 | Show off gallery / completed art | `framed painting glb`, `picture frame stylized` | Sketchfab, custom | 3–5 | Wood frame variants |
| Canvas drying rack | ⚪ | Workshop dressing | `art drying rack` | Custom/Sketchfab | 1 | Matches workshop |

### 1.8 Workshop Props

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Paint palette** | 🔴 | Golem holds it; ties to color UI | `artist palette glb`, `paint palette low poly` | Sketchfab, custom | 1 | Wooden, wells of paint |
| **Paint brushes** | 🔴 | In golem's hand, animated | `paint brush glb`, `artist brush stylized` | Sketchfab, custom | 2–3 | Various sizes |
| Paint buckets / jars | 🟡 | Color storage set dressing | `paint bucket glb`, `paint jar stylized` | Sketchfab, Quaternius | 4–6 | Bright lids = palette colors |
| Wooden stool / table | 🟡 | Workshop anchor | `wooden stool glb`, `rustic table low poly` | Quaternius, Sketchfab | 1–2 | Weathered wood |
| Lantern / fairy lights | 🟡 | Warm light sources, mood | `stylized lantern glb`, `hanging lantern fantasy` | Sketchfab, Synty | 2–3 | Emissive + flicker |
| Rolled scrolls / sketchbooks | 🟢 | Artist clutter, charm | `sketchbook glb`, `paper scroll low poly` | Sketchfab | 3–5 | Small props |
| Rug / tarp | 🟢 | Defines studio "floor zone" | `rug glb stylized`, `tarp cloth` | Sketchfab, custom | 1 | Patterned fabric |
| Crate / barrel storage | ⚪ | Background dressing | `crate barrel pack` | Quaternius, Synty | 2–4 | Shared atlas |

### 1.9 Paint Assets

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Paint splat textures** | 🔴 | Strokes appearing on canvas | `paint splatter texture`, `brush stroke alpha png`, `watercolor splat` | textures.com, custom paint scans, itch.io brush packs | 12–20 | Alpha PNG, high-res |
| **Brush stroke decals** | 🔴 | Marks on canvas / ground | `brush stroke decal`, `paint smear alpha` | Custom, Quixel decals | 8–12 | Alpha decals |
| Paint drip meshes/sprites | 🟡 | Drips off brush/canvas | `paint drip sprite`, `dripping paint texture` | Custom | 4–6 | Animated UVs or sprites |
| Wet paint normal maps | 🟢 | Glossy fresh-paint look | `wet paint normal map` | Custom bake | 2–3 | Tiling normals |
| Color swatch blobs | 🟡 | 3D paint dabs on palette | `paint blob glb`, `paint dab` | Custom (sphere-ish) | 8 (palette colors) | Glossy material |

### 1.10 Holi Powder Effects (signature VFX)

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Powder burst particle texture** | 🔴 | The hero color-explosion moment | `holi powder texture`, `colored smoke png`, `powder burst alpha`, `dust puff sprite` | itch.io VFX packs, Kenney, textures.com, custom photos | 4–6 sprites | Soft alpha, white (tinted in shader) |
| **Powder cloud sprite sheet** | 🔴 | Animated billowing cloud | `smoke sprite sheet`, `powder explosion flipbook`, `dust flipbook png` | Unity/Unreal VFX packs, itch.io, custom sim render | 1–2 sheets | Flipbook (e.g., 8×8) |
| Powder ground residue decals | 🟡 | Color left on ground after burst | `colored powder decal`, `dust residue alpha` | Custom from burst texture | 4–6 | Alpha decals, tinted |
| Floating powder motes | 🟢 | Lingering colored dust in air | `dust mote sprite`, `floating particle png` | Kenney particle pack | 2–3 | Tiny soft sprites |
| Color gradient ramps | 🔴 | Drives Holi palette in shaders | (authored, not searched) | Custom (texture ramps) | 1 set (6–8 colors) | 1D gradient textures |

### 1.11 UI Decorations

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Logo / wordmark** | 🔴 | Brand "Point Club" | (custom design) | In-house / designer | 1 (+ mono variant) | Stylized, matches forest theme |
| **Icon set (UI actions)** | 🔴 | Play, join, draw, sound, menu | `lucide`, `phosphor icons`, `game ui icon pack` | Lucide (already in repo), Phosphor, Kenney UI | ~20 icons | Consistent line/solid set |
| Wooden/leaf UI frames | 🟡 | Buttons/panels themed to forest | `wood ui frame png`, `fantasy ui kit`, `leaf border png` | itch.io GUI kits, Kenney UI, GameDev Market | 6–10 | 9-slice PNG |
| Decorative flourishes | 🟡 | Vines, leaves, sparkles around copy | `vine png`, `leaf flourish`, `sparkle png` | Freepik, custom | 8–12 | Transparent PNG/SVG |
| Cursor / pointer custom | 🟢 | Paintbrush cursor for immersion | `brush cursor png`, `custom game cursor` | Custom, itch.io | 2–3 states | Small PNG |
| Loading / progress art | 🟡 | Branded loader while 3D loads | `loading spinner png`, custom | Custom (golem silhouette) | 1 | Animated SVG/sprite |
| Badge / chip art | 🟢 | "New", "Beta", rank chips | `game badge png` | Custom, Freepik | 4–6 | Small PNG/SVG |
| Confetti / sparkle UI sprites | ⚪ | Reward feedback | `confetti png`, `sparkle sprite` | Kenney, custom | 3–5 | Transparent |

### 1.12 Sound Effects

| Asset | Tier | Purpose | Search keywords | Recommended sources | Qty | Target style |
|---|---|---|---|---|---|---|
| **Ambient forest loop** | 🔴 | Base atmosphere (birds, wind, leaves) | `forest ambience loop`, `nature ambient wav` | Freesound (CC0), Pixabay, Zapsplat | 1–2 loops | Seamless, soft |
| **Brush / paint stroke SFX** | 🔴 | Feedback when golem paints | `paint brush sound`, `brush stroke foley` | Freesound, Zapsplat | 3–5 | Short, organic |
| **Holi powder burst SFX** | 🔴 | Punch for the color explosion | `powder poof sound`, `dust burst`, `soft explosion whoosh` | Freesound, Zapsplat | 2–3 | Soft impact + whoosh |
| Golem movement SFX | 🟡 | Metallic/clay foot/joint sounds | `robot servo sound`, `clay creak`, `metal clank soft` | Freesound | 4–6 | Subtle, friendly |
| Golem "voice" chirps | 🟡 | Non-verbal reactions (wave/hello) | `cute robot chirp`, `beep boop friendly` | Freesound, Zapsplat | 4–6 | Warm, melodic |
| UI clicks / hovers | 🔴 | Button feedback | `ui click soft`, `wood tap ui sound` | Kenney Audio (free), Freesound | 4–6 | Crisp, woody |
| Reward / success sting | 🟡 | CTA / unlock moments | `success chime`, `magical sparkle sound` | Freesound, Zapsplat | 2–3 | Bright, short |
| Music bed (optional) | 🟢 | Light whimsical loop | `whimsical fantasy loop`, `ghibli style music royalty free` | Pixabay Music, Incompetech (CC), commission | 1 | Soft, loopable, low-key |

---

## 2. Production Folder Structure

```
/public/assets/
├── models/
│   ├── characters/
│   │   ├── copper-golem/          # golem.glb + textures + LODs
│   │   ├── companion/
│   │   └── shared-rigs/
│   ├── environment/
│   │   ├── terrain/
│   │   ├── skybox/
│   │   └── decals/
│   ├── foliage/
│   │   ├── trees/
│   │   ├── grass/
│   │   ├── flowers/
│   │   └── impostors/
│   ├── rocks/
│   ├── canvas/                    # easel, canvas board, frames
│   ├── props/                     # palette, brushes, lanterns, stools…
│   └── paint/                     # 3D paint blobs, drip meshes
├── textures/
│   ├── pbr/                       # albedo/normal/roughness/ao sets
│   ├── atlases/                   # shared env atlases
│   ├── alpha/                     # grass/leaf/paint alpha cards
│   ├── decals/
│   ├── ramps/                     # Holi gradient ramps
│   └── ibl-hdri/                  # environment lighting
├── vfx/
│   ├── particles/                 # sprite PNGs (dust, petals, motes)
│   ├── flipbooks/                 # powder/smoke sprite sheets
│   └── trails/                    # brush trail textures
├── ui/
│   ├── logo/
│   ├── icons/
│   ├── frames/                    # 9-slice wood/leaf frames
│   ├── flourishes/                # vines, sparkles, leaves
│   ├── cursors/
│   └── loaders/
├── audio/
│   ├── ambient/
│   ├── sfx/
│   │   ├── paint/
│   │   ├── holi/
│   │   ├── golem/
│   │   └── ui/
│   └── music/
└── fonts/                         # display + body type

/docs/
├── ASSET_PRODUCTION_PLAN.md       # this file
├── animation-requirements.md      # (Section 4 below)
├── vfx-requirements.md            # (Section 5 below)
├── ui-asset-requirements.md       # (Section 6 below)
└── licenses/                      # per-asset license + attribution records
```

**Naming convention:** `category_assetname_variant_LOD.ext`
e.g. `tree_oak_a_LOD1.glb`, `paint_splat_03_alpha.png`, `sfx_holi_burst_02.wav`.
All third-party assets get an entry in `/docs/licenses/` (source URL, license, author, attribution string).

---

## 3. Scene Hierarchy

```
HomepageScene (root)
│
├── Rig/
│   ├── Camera (cinematic dolly + cursor parallax)
│   ├── CameraTargets/ (idle, paint-focus, hero-burst framings)
│   └── PostFX (bloom, vignette, color grade, DOF optional)
│
├── Lighting/
│   ├── SunKey (directional, warm)
│   ├── SkyFill (hemisphere/ambient, cool)
│   ├── RimLight (separates golem from bg)
│   ├── IBL (HDRI environment)
│   └── PracticalLights/ (lanterns, glow flowers — emissive + point)
│
├── World/
│   ├── Skybox
│   ├── BackgroundLayers/ (hills, billboard trees, god-rays)
│   ├── Terrain (ground mesh + decals)
│   └── Atmosphere/ (fog, floating motes, petals, fireflies)
│
├── Forest/
│   ├── Trees_Hero/
│   ├── Trees_Instanced/ (InstancedMesh)
│   ├── Grass_Instanced/ (InstancedMesh, wind shader)
│   ├── Flowers_Instanced/
│   ├── Rocks/
│   └── Stumps_Logs/
│
├── Studio/  (the art-making zone)
│   ├── Easel
│   ├── CanvasBoard (dynamic paintable texture target)
│   ├── Palette
│   ├── Brushes/
│   ├── PaintJars_Buckets/
│   ├── Stool_Table/
│   ├── Lanterns/
│   ├── Rug
│   └── Clutter/ (scrolls, sketchbooks)
│
├── Characters/
│   ├── CopperGolem (rigged, AnimationMixer)
│   │   ├── Skeleton
│   │   ├── HandSocket_R (parents brush)
│   │   └── HandSocket_L (parents palette)
│   └── Companion (optional critter)
│
├── VFX/
│   ├── HoliBurstEmitters/ (triggered)
│   ├── PaintStrokeEmitter (follows brush tip)
│   ├── DustResidueDecals/
│   ├── AmbientParticles/ (petals, motes, fireflies)
│   └── GodRays/
│
├── Audio/
│   ├── AmbientLoop (positional/global)
│   ├── SFXBank/ (paint, holi, golem, ui)
│   └── MusicBed (optional)
│
└── UIOverlay/  (DOM/HTML layer above canvas — not in 3D)
    ├── Logo
    ├── HeroCopy + CTAs
    ├── ScrollCue
    ├── GameCards
    └── Decorations (vines, sparkles)
```

**Interaction zones (logical, not assets):** cursor-raycast on Golem → wave; click Golem → paint+burst; scroll → camera dolly; hover CTA → UI SFX.

---

## 4. Animation Requirements Document

**Hero: Copper Golem** — humanoid rig, delivered as glTF with named clips. AnimationMixer with blend/crossfade.

| Clip | Type | Length | Loop | Purpose / trigger | Priority |
|---|---|---|---|---|---|
| `idle_breathe` | Loop | 4–6s | ✅ | Default resting state | 🔴 |
| `idle_look_around` | Loop variant | 5–8s | ✅ | Adds life between actions (random) | 🟡 |
| `paint_stroke` | Action | 2–3s | ✅ (cycle) | Core: painting the canvas | 🔴 |
| `dip_brush` | Action | 1–1.5s | ❌ | Reaches to palette between strokes | 🟡 |
| `wave_hello` | Action | 1.5–2s | ❌ | Reacts to cursor proximity | 🔴 |
| `react_click` | Action | 1–1.5s | ❌ | Reacts to click → triggers Holi burst | 🔴 |
| `step_turn` | Action | 1–2s | ❌ | Subtle reposition / face camera | 🟢 |
| `cheer` / `celebrate` | Action | 2s | ❌ | On CTA / success | 🟢 |
| `sleep_idle` | Loop | — | ✅ | Inactivity fallback | ⚪ |

**Procedural / shader animation (no clips needed):**
- **Wind** on grass, leaves, flowers (vertex shader, sine + noise).
- **Camera dolly** (scroll-driven path) + **cursor parallax** (subtle lerp).
- **Brush-tip follow** for paint emitter (socket-driven).
- **Lantern flicker** (emissive intensity noise).
- **Ambient float** for motes/petals/fireflies (curl noise).
- **Canvas reveal** (paint texture animates in as golem strokes).

**Blending rules:** idle ↔ action crossfade 0.2–0.3s; paint loop interrupts cleanly on click → `react_click` → Holi burst → return to idle. State machine: `IDLE → (proximity) WAVE → IDLE → (auto) PAINT loop ⇄ DIP → (click) REACT+BURST → IDLE`.

**Deliverables:** one GLB with all clips OR base mesh + separate animation GLBs sharing skeleton. Root motion disabled (in-place). 30fps bake acceptable, 60 preferred for hero.

---

## 5. VFX Requirements Document

| Effect | Tech approach | Assets used | Trigger | Tier |
|---|---|---|---|---|
| **Holi powder burst** | GPU particle emitter + flipbook sprites, tinted by gradient ramp; radial velocity, gravity, fade | powder sprites, flipbook sheet, color ramps | Golem click / scroll beat | 🔴 |
| **Paint stroke trail** | Ribbon/trail or short-lived sprites at brush tip; color = current palette swatch | brush stroke alpha, drip sprites | During `paint_stroke` | 🔴 |
| **Canvas paint reveal** | Dynamic render texture / decal accumulation onto CanvasBoard | paint splat alphas, brush decals | While painting | 🔴 |
| **Ground powder residue** | Decals projected at burst origin, tinted, fade over time | residue decals | After Holi burst | 🟡 |
| **Floating ambient particles** | Continuous low-count emitter (petals, pollen, fireflies) | petal/mote sprites | Always (ambient) | 🟡 |
| **God rays / volumetric shafts** | Additive planes or screen-space shafts through canopy | light shaft texture | Static + subtle drift | 🟢 |
| **Dust puff on golem step** | Tiny one-shot puff at feet | dust puff sprite | On `step_turn` | 🟢 |
| **Sparkle on hover/CTA** | UI-layer sprite burst (2D) | sparkle png | Hover CTA / success | 🟢 |
| **Fog / depth haze** | Scene fog (color-graded) + soft ground mist plane | (shader/none) + mist texture | Always | 🟡 |

**Global VFX rules:**
- All particle textures authored **white/grayscale**, colorized in-shader from Holi ramp → maximum reuse, minimal texture memory.
- Hard caps: Holi burst ≤ ~300 particles desktop / ≤ 80 mobile. Ambient ≤ 60 / ≤ 20.
- Additive blending for light/powder; alpha blend for petals/decals.
- Mobile: disable god-rays, reduce emitter counts, swap flipbook for single sprite, cap decals.
- Everything pools/recycles — no per-trigger allocation.

---

## 6. UI Asset Requirements Document

**Layer model:** 3D scene renders to a full-bleed canvas; UI is an HTML/DOM overlay on top (crisp text, accessible, responsive). UI art is 2D (PNG/SVG), themed to the forest world.

| Asset group | Specs | Format | States/variants | Tier |
|---|---|---|---|---|
| **Logo / wordmark** | Horizontal + stacked + monochrome | SVG (+ PNG fallback) | light/dark | 🔴 |
| **Action icons** | 24/32px grid, 2px stroke, consistent corners | SVG (Lucide base, extend as needed) | default/hover/active/disabled | 🔴 |
| **Primary buttons** | Forest-themed, chunky, soft shadow | CSS + optional 9-slice frame PNG | rest/hover/press/disabled | 🔴 |
| **Panel / card frames** | Wood/leaf bordered containers | 9-slice PNG or CSS | — | 🟡 |
| **Decorative flourishes** | Vines, leaves, sparkles framing copy | SVG/PNG transparent | left/right mirrored | 🟡 |
| **Custom cursor** | Paintbrush pointer | PNG (32px, hotspot defined) | default/hover/drawing | 🟢 |
| **Loading screen** | Branded golem-silhouette loader + % | SVG/Lottie/sprite | — | 🟡 |
| **Scroll cue** | Animated "begin" chevron | SVG + CSS anim | — | 🟡 |
| **Game cards** | Image/icon + title + CTA, hover-expand | CSS + icons | rest/open | 🟡 |
| **Badges / chips** | New/Beta/rank | SVG/PNG | color variants | 🟢 |
| **Toast / feedback** | Success/error with sparkle | CSS + sparkle sprite | success/error | 🟢 |

**Typography:** 1 display face (rounded, friendly, characterful) + 1 readable body face. Provide WOFF2, subset. (Already referenced via `--font-display` in codebase.)
**Responsiveness:** all UI art exported @1x/@2x; SVG preferred for crispness. Mobile-first layout; UI must remain legible over busy 3D background (use scrims/backdrop-blur, already a pattern in repo).
**Accessibility:** icon-only buttons require labels/titles; sufficient contrast over scene; respect `prefers-reduced-motion` (downgrade VFX & camera).

---

## 7. Asset Classification Summary

### 🔴 Critical (cannot ship homepage without these)
- Copper Golem (rigged + core anim clips: idle, paint, wave, react_click)
- Ground/terrain + skybox
- Hero tree(s) + grass cards (the forest read)
- Easel + paintable canvas board
- Paint palette + brushes
- Paint splat/stroke textures (canvas painting)
- Holi powder burst textures + flipbook + color ramps
- Logo, core icon set, primary buttons
- Ambient forest loop + brush SFX + Holi burst SFX + UI clicks

### 🟡 Important (needed for the "premium / alive" target, can phase in)
- Mid-ground instanced trees, grass clumps, flowers, rocks
- Background layers / billboards for depth
- Paint jars, stool/table, lanterns
- `idle_look_around`, `dip_brush` animations
- Ground residue decals, ambient particles, fog
- Wood/leaf UI frames, flourishes, loader, scroll cue, game cards
- Golem movement/voice SFX, success sting

### 🟢 Optional (enhances, not required for first ship)
- Companion critter, stumps/logs, glowing flowers, pebbles
- God-rays, step dust puffs, hover sparkles
- Finished painting frames, rug, scrolls/sketchbooks
- `step_turn`, `cheer` animations
- Custom cursor, badges, toasts
- Music bed

### ⚪ Nice-to-have (future / polish / unlocks)
- Golem alt-skins, seasonal variants
- Crates/barrels, drying rack
- `sleep_idle` animation, confetti UI
- Floating powder motes, alt skyboxes

---

## 8. Missing Assets (gaps to commission/source before build)

These have **no off-the-shelf guarantee** and are the long-lead, highest-risk items — start sourcing/commissioning **now**:

1. **Rigged Copper Golem with the exact clip set** — almost certainly a **custom commission** (or AI-gen base + manual rig/retarget + retexture). This is the #1 critical path and bottleneck. Budget 2–4 weeks lead.
2. **Paintable canvas pipeline asset** — the canvas board is trivial, but the *dynamic paint texture target* is a bespoke setup; the splat/stroke alpha library must be curated/authored.
3. **Holi color-ramp + white-particle library** — authored, not downloaded. Needs an art pass to nail the signature look.
4. **Brand assets** — logo/wordmark, custom display font choice, themed UI frames — design-dependent, in-house.
5. **Cohesive style match** — biggest hidden risk: trees/rocks/props from different free packs will clash. **Plan a unification pass** (shared atlas palette, consistent shader/lighting) or source a single matched pack (e.g., Synty / Quaternius Ultimate Nature) to guarantee cohesion.
6. **Mobile LOD/impostor set** — must be generated; not a download.

---

## Recommended Source Shortlist (licensing-aware)
- **Free, commercial-OK:** Quaternius (CC0), Kenney (CC0 — UI, audio, particles), Poly Haven (CC0 — HDRI, textures), Freesound (filter CC0/CC-BY), Pixabay.
- **Paid/marketplace (cohesion):** Synty Studios, KitBash3D, Sketchfab Store, GameDev Market, itch.io VFX/GUI packs.
- **Custom/AI base:** ArtStation/Fiverr commission (golem), Meshy/Tripo (block-out base only — expect cleanup).
- **Always** record license + attribution in `/docs/licenses/` per asset.

---

*End of production plan. No implementation has been started — this document gates the build phase.*
