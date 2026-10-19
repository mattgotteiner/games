# Block Drop Themes: Art Direction

This document is the visual source of truth for the themes. Read
`art-direction/preview.html` with it. That file is a runnable sketch of every
cell recipe and clear effect described here, and its drawing code can be
ported almost directly into `theme-renderers/*.ts`.

## Principles (apply to every theme)

1. **One world per theme.** The board, pieces, HUD, buttons, pause card, Help
   dialog, callout, and page background must look like they come from the same
   object or place. If something looks like Classic with new colors, it is not
   finished.
2. **Gameplay legibility beats flavor.** At 27 px per cell (a phone), all
   seven pieces must stay distinguishable at a glance. The landing preview must
   be obviously "not a real piece". Texture is a quiet second read.
3. **The line clear is the theme's signature moment.** It gets the boldest
   motion in the theme. Everything else stays calm.
4. **Procedural only.** Canvas paths, gradients, and CSS. No images, sprites,
   or web fonts. Everything must keep working offline.
5. **Keep the playfield unframed.** Themes must not add a decorative border,
   outline, or shadow around the board. Focus indicators remain on controls
   and theme options.
6. **Deterministic texture.** Every speck, hatch, streak, drip, leaf, and
   shard comes from `hash(x, y, salt)`, so nothing flickers between frames.
7. **Display fonts are an accent.** Use them for the game title, the score
   number, the pause or game-over heading, and the line-clear callout. Use the
   UI font for everything else.

## Theme summary

| Theme | One-line concept | Shape language | Clear effect | `clearMs` |
|---|---|---|---|---|
| Classic | The original midnight board | Square, bevelled | White flash | 360 |
| Tron | Light lines on an endless grid | Sharp, hollow, glowing | Light-cycle beam derezzes rows into sliding scanlines | 640 |
| Chocolate | A box of little bars | Square, embossed, glossy | Stacked bars merge into one dripping melt | 840 |
| Nature | Mossy stone tiles and falling leaves | Square tiles, organic texture | Stones turn into leaves that sway and drift down | 800 |
| Sketchbook *(new)* | Colored pencil on graph paper | Wobbly ink outline, hatched | A pink eraser scrubs the row away, leaving crumbs | 760 |
| Stained Glass *(new)* | Jewel light through leaded panes | Lead lines, faceted glass | Panes crack, then shatter into falling shards | 720 |

### Why these two new themes

- **Sketchbook** is the only **light** theme. It gives players a
  daylight-readable option and contrasts with the four dark worlds. The
  eraser clear is funny and very readable.
- **Stained Glass** is a **mid-tone, jewel-colored** theme. It covers the
  "elegant and rich" corner that none of the others reach. Shattering glass is
  the most satisfying clear in the set.

Runners-up, if the user prefers either one: **Retro Arcade CRT** (scanlines,
pixel fonts, rows "blip" out like an 8-bit sprite) and **Ocean** (bubbles and
sea glass, rows rise as bubbles). Both overlap with Tron and Nature more than
the chosen two do.

---

## Token reference

`themes.ts` defines these values. `BlockDrop.tsx` applies them as
`--bd-<name>` on the game root. In `app.css`, write every replaced literal as
`var(--bd-<name>, <original Classic literal>)`. Then shared selectors, such as
`.button-primary` used by the catalog, keep their current look outside Block
Drop.

| Token | Used for |
|---|---|
| `page` | `html`/`body` background while the game is mounted |
| `text` | Main text, score number |
| `text-muted` | Secondary copy (scoring notes, captions, preview names) |
| `label` | Uppercase HUD labels, legends |
| `accent` | Selected theme ring, slider thumb and track fill, level-up highlight, hover border |
| `panel` | **Solid** stand-in for `panel-bg`. Used only by contrast tests |
| `panel-bg` | HUD background (may be a gradient) |
| `panel-border` | HUD and Help dialog border |
| `card-bg` | Pause, game-over, and Help card background |
| `card-border` | Card border |
| `primary-bg` / `primary-hover-bg` / `primary-text` | Primary buttons (Resume, Play again, Drop) |
| `secondary-bg` / `secondary-hover-bg` / `secondary-border` / `secondary-text` | Secondary buttons (Restart, Help, Pause) |
| `control-bg` / `control-border` / `control-text` | Gameplay control buttons |
| `focus` | `:focus-visible` outline |
| `press` | `button:active` inset overlay |
| `swatch-ring` | Theme picker swatch border |
| `board-backdrop` | `.board-surface` background, visible at the canvas edges |
| `scrim` | `.game-overlay` background over the board |
| `preview-empty` | Empty Hold and Next grid cells |
| `callout-text` / `callout-shadow` | Line-clear callout color and `text-shadow` |
| `radius-panel` / `radius-control` / `radius-score` | Corner radii; all are `0` in every theme |
| `font-ui` / `font-display` | Font stacks |

All radius tokens are `0` for every theme. Keep static board cells, previews,
swatches, panels, cards, dialogs, milestone popups, buttons, and gameplay
controls square. Only transient clear-effect artwork may use curved outlines
when its visual effect calls for them. Status-dot colors (green, amber, rose,
and white) are semantic. Keep them the same in every theme.

`CLASSIC_STACK` = `Inter, ui-rounded, "SF Pro Rounded", system-ui,
-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (the current
`:root` stack).

### Token values

| Token | Classic | Tron | Chocolate | Nature | Sketchbook | Stained Glass |
|---|---|---|---|---|---|---|
| page | `#07111f` | `#020409` | `#1b0f0a` | `#1a1f17` | `#efe9dc` | `#0d0f1c` |
| text | `#f8fafc` | `#e6fbff` | `#fbf1e3` | `#f1eadb` | `#2b2a28` | `#f4ecd8` |
| text-muted | `#a8c4df` | `#7fa9b8` | `#cdb59b` | `#b9b29f` | `#5f5a52` | `#b7ad96` |
| label | `#7dd3fc` | `#00e5ff` | `#e3b866` | `#a8c686` | `#b8322a` | `#d4af37` |
| accent | `#67e8f9` | `#00e5ff` | `#e3b866` | `#a8c686` | `#1f6fd1` | `#d4af37` |
| panel | `#132641` | `#050b14` | `#2b1911` | `#232b20` | `#fbf8f0` | `#171a2e` |
| panel-bg | `linear-gradient(160deg, rgb(25 48 79 / 96%), rgb(12 27 47 / 96%))` | `linear-gradient(180deg, rgb(5 11 20 / 94%), rgb(2 4 9 / 94%))` | `linear-gradient(160deg, #35201a, #24140d)` | `linear-gradient(160deg, #283224, #1f261c)` | `#fbf8f0` | `linear-gradient(160deg, #1c2038, #121527)` |
| panel-border | `#2d4768` | `rgb(0 229 255 / 45%)` | `#6b4429` | `#4a5a40` | `#8a8172` | `#3b3f63` |
| card-bg | `linear-gradient(155deg, #1a3557, #0a192d 82%)` | `linear-gradient(180deg, #06101c, #020409)` | `linear-gradient(155deg, #3a2318, #1f110b 82%)` | `linear-gradient(155deg, #2e3a29, #1c2318 82%)` | `#fffdf7` | `linear-gradient(180deg, #1f2440, #10132a 82%)` |
| card-border | `#52749c` | `#00e5ff` | `#b8913f` | `#6b7d5a` | `#3a3a3a` | `#d4af37` |
| primary-bg | `#67e8f9` | `#00e5ff` | `#e3b866` | `#a8c686` | `#2b2a28` | `#d4af37` |
| primary-hover-bg | `#a5f3fc` | `#7ff3ff` | `#f0cd85` | `#bdd6a0` | `#45433f` | `#e6c65a` |
| primary-text | `#07111f` | `#001018` | `#2b1408` | `#1a2414` | `#fbf8f0` | `#1a1405` |
| secondary-bg | `#1e3049` | `#07131f` | `#3a2216` | `#2c3628` | `#fffdf7` | `#20243d` |
| secondary-hover-bg | `#254260` | `#0b2030` | `#4a2c1d` | `#364331` | `#f3eee2` | `#2a2f4e` |
| secondary-border | `#3e5c82` | `#1a6c80` | `#7a5032` | `#55684a` | `#7a7163` | `#4a4f7a` |
| secondary-text | `#eff6ff` | `#c8f6ff` | `#fbf1e3` | `#f1eadb` | `#2b2a28` | `#f4ecd8` |
| control-bg | `#162942` | `#04101a` | `#3a2216` | `#2c3628` | `#fffdf7` | `#1b1f36` |
| control-border | `#355373` | `#0b5d70` | `#6b4429` | `#4a5a40` | `#7a7163` | `#3b3f63` |
| control-text | `#e0f2fe` | `#8ff3ff` | `#f3dcc0` | `#f1eadb` | `#2b2a28` | `#efe4c8` |
| focus | `#fbbf24` | `#ff2bd6` | `#ffd98a` | `#f2c14e` | `#1f6fd1` | `#7fd8ff` |
| press | `rgb(7 17 31 / 18%)` | `rgb(0 229 255 / 14%)` | `rgb(0 0 0 / 22%)` | `rgb(0 0 0 / 18%)` | `rgb(43 42 40 / 10%)` | `rgb(0 0 0 / 22%)` |
| swatch-ring | `#3a5b83` | `#00e5ff` | `#b8913f` | `#6b7d5a` | `#8a8172` | `#d4af37` |
| board-backdrop | `radial-gradient(circle at 50% 45%, #132641, #091525 70%)` | `#03060c` | `#2e0f14` | `#1e2419` | `#fbf8f0` | `#121212` |
| scrim | `rgb(7 17 31 / 24%)` | `rgb(2 4 9 / 35%)` | `rgb(27 15 10 / 30%)` | `rgb(26 31 23 / 28%)` | `rgb(239 233 220 / 35%)` | `rgb(13 15 28 / 30%)` |
| preview-empty | `rgb(148 163 184 / 10%)` | `rgb(0 229 255 / 6%)` | `rgb(201 162 74 / 10%)` | `rgb(232 220 192 / 6%)` | `rgb(127 166 207 / 18%)` | `rgb(255 255 255 / 5%)` |
| callout-text | `#f8fafc` | `#e6fbff` | `#fbf1e3` | `#f1eadb` | `#2b2a28` | `#f4ecd8` |
| callout-shadow | `0 2px 1rem rgb(0 0 0 / 75%)` | `0 0 0.5rem #00e5ff, 0 0 1.25rem rgb(0 229 255 / 70%)` | `0 2px 0 #5a301c, 0 0.4rem 1rem rgb(0 0 0 / 60%)` | `0 2px 1rem rgb(0 0 0 / 60%)` | `0 0 0.35rem #fbf8f0, 0 0 0.2rem #fbf8f0` | `0 2px 0 #000, 0 0 1rem rgb(212 175 55 / 55%)` |
| radius-panel | `0` | `0` | `0` | `0` | `0` | `0` |
| radius-control | `0` | `0` | `0` | `0` | `0` | `0` |
| radius-score | `0` | `0` | `0` | `0` | `0` | `0` |
| font-ui | CLASSIC_STACK | `ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace` | CLASSIC_STACK | `ui-rounded, "SF Pro Rounded", ` + CLASSIC_STACK | CLASSIC_STACK | CLASSIC_STACK |
| font-display | CLASSIC_STACK | same as font-ui | `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif` | same as font-ui | `"Segoe Print", "Bradley Hand", "Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive` | `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif` |
| **metaThemeColor** | `#162033` (unchanged) | `#020409` | `#1b0f0a` | `#1a1f17` | `#efe9dc` | `#0d0f1c` |

Board (Canvas) values (`theme.board`):

| | Classic | Tron | Chocolate | Nature | Sketchbook | Stained Glass |
|---|---|---|---|---|---|---|
| background | `#07111f` | `#03060c` | `#2e0f14` | `#1e2419` | `#fbf8f0` | `#121212` |
| grid | `rgb(148 163 184 / 18%)` | `rgb(0 229 255 / 11%)` | `rgb(201 162 74 / 16%)` | `rgb(232 220 192 / 7%)` | `rgb(127 166 207 / 32%)` | `#262626` |
| gridWidth | 1 | 1 | 1 | 1 | 1 | 2 |
| pausedVeil | `rgb(7 17 31 / 84%)` | `rgb(2 4 9 / 86%)` | `rgb(27 15 10 / 86%)` | `rgb(26 31 23 / 84%)` | `rgb(239 233 220 / 86%)` | `rgb(13 15 28 / 86%)` |
| gameOverVeil | `rgb(7 17 31 / 76%)` | `rgb(2 4 9 / 78%)` | `rgb(27 15 10 / 78%)` | `rgb(26 31 23 / 76%)` | `rgb(239 233 220 / 80%)` | `rgb(13 15 28 / 78%)` |

Piece colors (`theme.pieces`):

| Piece | Classic | Tron | Chocolate | Nature | Sketchbook | Stained Glass |
|---|---|---|---|---|---|---|
| I | `#38bdf8` | `#00e5ff` cyan | `#5a301c` dark | `#6fb3c8` water | `#3d8fd1` | `#2bb3b1` aquamarine |
| J | `#818cf8` | `#2f6bff` blue | `#9bb35a` matcha | `#8090b8` dusk slate | `#2c4f9e` | `#1f4fb5` sapphire |
| L | `#fb923c` | `#ff8a00` orange | `#d9963f` caramel | `#dcc79a` sand | `#e07b28` | `#e39b17` amber |
| O | `#facc15` | `#ffe600` yellow | `#a8714a` milk | `#e6b843` sunflower | `#e8c22c` | `#f2cf4a` citrine |
| S | `#4ade80` | `#39ff14` green | `#9fd8bf` mint | `#86a95c` moss | `#4b9e3f` | `#138a52` emerald |
| T | `#c084fc` | `#ff2bd6` magenta | `#f1e4cc` white | `#b08fcf` lavender | `#8d4fb3` | `#7b3fa6` amethyst |
| Z | `#fb7185` | `#ff1f4b` red | `#c75b7a` ruby | `#c9654b` terracotta | `#d1433a` | `#b3122e` ruby |

All contrast pairs in these tables were checked: text and labels against
their surfaces are at least 4.5:1, and focus rings and button borders against
their surfaces are at least 3:1. The unit test in `tasks.md` 4.1 keeps them
that way.

---

## Classic

**Concept:** It stays exactly as it is today. It is the baseline the other
themes are measured against.

- Cells, ghost, grid, and veils: move the current code into
  `theme-renderers/classic.ts` without changing it.
- Clear: the current 180 ms white flash with intensity
  `0.3 + sin(p·π)·0.7`. Draw the cleared rows' cells first, then the flash on
  top, as today.
- No CSS decoration.

## Tron

**Concept:** You are inside the machine. The pieces are made of light, and
everything else is black glass with a cyan grid. The look is sharp, precise,
and cool. Keywords: *light cycle, wireframe, synth, scanline*.

**Canvas**

- *Background:* fill with `#03060c`. Draw the grid. Then add a "horizon
  glow" over the bottom 40% of the board: a linear gradient from transparent
  to `rgb(0 229 255 / 9%)` at the bottom.
- *Cell:* use an inset of 12% of the cell size. Draw these layers in order:
  1. Fill the inset square with the piece color at 16% alpha.
  2. Draw the glow: stroke the inset square with the color at 28% alpha,
     `lineWidth = size·0.2`.
  3. Draw the tube: stroke the same square with the full color,
     `lineWidth = max(1.5, size·0.07)`.
  4. Draw the core: a 1 px stroke at `rgb(255 255 255 / 55%)` around the
     center square, from 34% to 66% of the cell.
  The result reads as a hollow neon tile.
- *Ghost:* a dashed outline (`[size·0.2, size·0.12]`) in the piece color at
  55% alpha, `lineWidth 1.5`, with no fill.
- *Clear "Derez" (640 ms):*
  - From 0 to 40%, a white beam 3 px wide and 1.3 rows tall sweeps from left
    to right across each cleared row. A cyan trail fades out over 3 cells
    behind it. Cells behind the beam turn into white wireframe scanlines.
  - From 40 to 100%, each cell splits into 4 horizontal slices, each 11% of
    the cell tall. Each slice slides sideways by
    `(hash − 0.5)·2.2·size·ease(q)` and fades out. This is a glitch or
    derez effect.

**UI and CSS decoration** (`.block-drop[data-theme="tron"]`)

- Use the monospace font for all text. Set labels in uppercase with
  `letter-spacing: 0.2em`. Labels, the score, and headings get
  `text-shadow: 0 0 0.5rem rgb(0 229 255 / 60%)`.
- The HUD, cards, and board get
  `box-shadow: 0 0 0 1px var(--bd-card-border), 0 0 1rem rgb(0 229 255 / 30%)`.
  The primary button gets a matching outer glow. Use sharp 2 to 4 px radii.
- Preview cells:
  `background: color-mix(in srgb, var(--piece) 16%, transparent); box-shadow: inset 0 0 0 2px var(--piece), 0 0 6px var(--piece);`
- Callout: monospace, uppercase, with a cyan glow from `callout-shadow`.
- The page background stays black. Do **not** add a moving grid. Calm
  backgrounds are a rule for every theme.

## Chocolate

**Concept:** A luxury chocolate box. A burgundy velvet liner holds little
square bars of different varieties, framed in gold foil. The look is warm,
indulgent, and a little playful. Keywords: *praline box, gold foil, ganache,
embossed squares*.

**Canvas**

- *Background:* burgundy liner `#2e0f14` with a faint gold grid. No
  gradient.
- *Cell (one segment of a bar):*
  1. Draw a square-cornered rectangle with a 5% inset, filled with the piece
     color.
  2. Draw an embossed inner square at a 24% inset. Use a light stroke
     `rgb(255 240 220 / 26%)` on the top and left edges and a dark stroke
     `rgb(0 0 0 / 32%)` on the bottom and right edges, with
     `lineWidth = size·0.07`.
  3. Add a small square-cornered gloss strip at the top left
     (`rgb(255 255 255 / 10%)`, from 14% to 48% of the width, 8% of the height).
  The four cells of a tetromino read as a little segmented bar.
- *Ghost:* a dotted gold outline (`rgb(227 184 102 / 60%)`, square caps, dash
  `[1.5, size·0.12]`) on a square-cornered rectangle. It looks like an empty
  slot in the paper tray.
- *Clear "Melt" (840 ms):*
  - **Soften, 0 to 35%:** the square emboss fades to 0 and the gloss brightens
    to 28%. The bars lose their rigid detail without rounding their corners.
  - **Stacked slump, 25 to 100%** (`m = ease((p − 0.25)/0.75)`): each
    contiguous set of cleared rows becomes one vertically stacked molten
    mass. The mass has one shared top edge that sinks by `m·0.5·size` and
    ripples across the full board width with a gentle sine wave
    (`sin(x/size·1.7 + topRow)·0.1·size·m`). Keep each cleared row's cell
    colors as adjacent horizontal bands inside this single silhouette so
    multi-row clears look like one tall marbled melt, not separate row strips.
  - **Drips:** draw drips only from the shared lower edge of each stacked
    mass. Each cell-column may get up to 2 drips (skip a drip when
    `hash < 0.35`). A drip is 22% of the size wide, with length
    `(0.6 + hash·1.4)·size·m` and a liquid end. Drips run down over the rows
    below, contained by the board clip. Non-adjacent cleared row groups stay
    visually separate.
  - **Gloss line:** a cream stroke `rgb(255 240 220 / 28%)` follows the
    rippled top edge.
  - **Fade, 70 to 100%:** global alpha goes from 1 to 0.

**UI and CSS decoration**

- Use the serif display font for headings, the score, and the callout. Set
  the callout in italic.
- Use square-cornered buttons. Primary buttons are gold foil. Add a subtle
  diagonal sheen to the primary button:
  `background: linear-gradient(135deg, #f0cd85, #e3b866 45%, #c99a45)`.
- Cards have a 1 px gold border plus an inner keyline:
  `box-shadow: inset 0 0 0 3px #2b1911, inset 0 0 0 4px rgb(227 184 102 / 35%)`.
  This looks like a chocolate box lid.
- Preview cells are square with
  `box-shadow: inset 2px 2px 0 rgb(255 240 220 / 25%), inset -2px -2px 0 rgb(0 0 0 / 30%)`.

## Nature

**Concept:** You are sitting by a stream at dusk. The pieces are square stone
tiles with mossy color and grain, the board is earth, and cleared rows become
leaves that drift away. It is the calmest theme: slow, soft, and organic in
texture while keeping square corners. Keywords: *stone tiles, moss, dusk,
falling leaves, breathing room*.

**Canvas**

- *Background:* a vertical gradient from `#1b2117` at the top to `#2a3122`
  at the bottom, with a very faint warm grid.
- *Cell (stone tile):* a square-cornered rectangle with a 6% inset. Fill it
  with a radial gradient whose light source sits at
  (35%, 30%): a lighter tint (`mix(color, white, 0.28)`), then the base color
  at 55%, then a darker shade (`mix(color, black, 0.2)`) at the edge. Add two
  tiny darker speckles (`rgb(0 0 0 / 14%)`, radius 3.5% of the size) at hashed
  positions for a stone grain.
- *Ghost:* a dashed square outline in the piece color at 50% alpha, with
  dash `[size·0.14, size·0.1]`.
- *Clear "Leaf fall" (800 ms):*
  - From 0 to 100%, a soft moss wash `rgb(168 198 134 / 22%)` covers the
    row and fades as `1 − p`.
  - **Transform, 0 to 30%:** each stone tile cross-fades into a leaf of the same
    color. The leaf is a pointed ellipse made from two quadratic curves, with
    a thin `rgb(0 0 0 / 22%)` midrib. Its starting angle is
    `(hash − 0.5)·0.6` radians.
  - **Drift, 15 to 100%** (`q`): each leaf falls `1.8·size·q^1.4`, sways
    sideways by `sin(q·2π + hash·6)·0.35·size·q`, turns by up to
    `(hash − 0.5)·2.4` radians, shrinks slightly, and fades as `1 − q²`.
  Use slow easing and no snapping. This is the one theme where the clear
  should feel unhurried.

**UI and CSS decoration**

- Use the `ui-rounded` stack for everything. Keep panels and buttons
  square-cornered.
- Use soft, low shadows and no glows. Keep borders at 1 px in moss tones.
- The callout fades in and out, which is calm. The existing animation is
  fine. If the callout uses scale in other themes, do not scale it here.
- Preview cells are square, with `background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--piece), white 28%), var(--piece) 55%, color-mix(in srgb, var(--piece), black 20%))`.

## Sketchbook (new)

**Concept:** A game someone doodled in the margins of graph paper with
colored pencils and a graphite outline. It is the only light theme. The look
is friendly, handmade, and a bit wobbly. Keywords: *graph paper, colored
pencil hatching, graphite, pink eraser, notebook*.

**Canvas**

- *Background:* paper `#fbf8f0`. Draw a blue graph grid
  (`rgb(127 166 207 / 32%)`). Every 5th line is a stronger major line
  (`rgb(127 166 207 / 50%)`).
- *Cell:*
  1. **Hatch:** clip to the cell with an 8% inset. Draw diagonal strokes
     every `size·0.16`. Each stroke runs from bottom left to top right with a
     slope jitter of `(hash − 0.5)·0.25·size`. Use the piece color at 85%
     alpha, `lineWidth max(1, size·0.07)`, and round caps.
  2. **Outline:** use graphite `#3a3a3a` with `lineWidth max(1, size·0.05)`.
     Draw the four sides as separate lines. Jitter each corner by
     `±size·0.04`, and extend each line 6% past its corners so they overshoot
     like a quick pencil sketch.
  Seed the texture as described in design §2, so the active piece does not
  shimmer while it moves.
- *Ghost:* a dashed graphite outline at 45% alpha, `lineWidth 1.2`, with no
  hatch. It looks like a light construction line.
- *Clear "Eraser" (760 ms):*
  - One classic pink-and-blue eraser scrubs each contiguous group of cleared
    rows from left to right. Its x position is
    `ease(p/0.8)·(W + 1.2)·size − 0.6·size`. The body is pink `#f4a6b4` and
    the sleeve is blue `#3d6fb6`. It has a graphite outline and is tilted
    −8°. For a multi-row group, it bobs between the rows while moving across
    them: with `groupTop` and `groupHeight` in pixels, its center y is
    `groupTop + groupHeight/2 + sin(p·6π)·(groupHeight − size)/2`. A
    single-row group keeps a small wobble of
    `sin(p·46 + groupIndex)·0.08·size`.
  - Cells that the eraser has passed lose their hatch over 1.5 cells, and
    their outline disappears immediately. A faint gray smudge band
    `rgb(80 80 80 / 12%)`, from 30% to 70% of the row height, fades out over
    the effect.
  - Each erased cell leaves 3 eraser crumbs: small pink-gray ellipses that
    fall about 0.9 cells and fade out.
  - The eraser leaves the board by 85%.

**UI and CSS decoration**

- Use the handwriting display font for the title, headings, score, and
  callout. Rotate the callout `-3deg`.
- Panels, cards, and buttons use a hand-drawn square-cornered border with
  `border-width: 2px` and slight line wobble. Keep corners square.
- The primary button is solid graphite ink with paper-colored text.
- Treat this as a light theme. Disabled controls must still read as
  disabled: dashed border plus reduced opacity, as today. Check this
  carefully.
- Preview cells: a transparent background with a 2 px graphite border,
  `background: repeating-linear-gradient(45deg, var(--piece) 0 2px, transparent 2px 5px)`.

## Stained Glass (new)

**Concept:** A cathedral window at golden hour. Each cell is a pane of
jewel-colored glass set in dark lead came. Warm light glows behind the board.
The look is rich, solemn, and elegant. Keywords: *rose window, lead came,
jewel tones, gold leaf, light through glass*.

**Canvas**

- *Background:* lead-black `#121212` with a 2 px `#262626` grid. Empty
  cells read as an empty leaded frame.
- *Cell (pane):*
  1. Fill the whole cell with a diagonal linear gradient from
     `mix(color, white, 0.32)` at the top left, through the base color, to
     `mix(color, black, 0.28)` at the bottom right.
  2. Draw one faint curved "seed" streak (`rgb(255 255 255 / 9%)`) at a
     hashed height. This adds the waviness of antique glass.
  3. Draw a small white glint triangle at the top left
     (`rgb(255 255 255 / 35%)`).
  4. Draw the **lead came**: stroke the cell edge in `#161616` with
     `lineWidth = size·0.13`.
  5. Draw a 1 px inner highlight at `rgb(255 255 255 / 12%)`.
- *Ghost:* fill with the piece color at 12% alpha, plus a `#5a5a5a` lead
  outline. It looks like a pane waiting for glass.
- *Clear "Shatter" (720 ms):*
  - **Crack, 0 to 30%:** light floods the panes: the gradient lightens by up
    to 40%. Three white crack lines (`rgb(255 255 255 / 85%)`, 1.2 px) grow
    from a hashed point near each cell's center toward three hashed edge
    points.
  - **Shatter, 30 to 100%** (`q`): each pane splits into 4 triangular shards
    that meet at the crack origin. Each shard flies outward
    (`vx = (centroid − origin)·2.4 + (hash − 0.5)·1.2·size`), first gets a
    small upward pop (`vy = −0.7·size·hash`), then falls with gravity
    (`+0.5·7·size·q²`). It spins by `(hash − 0.5)·4·q` radians and fades as
    `1 − q`. Shards keep a thin lead edge.

**UI and CSS decoration**

- Use the serif display font for headings, the score, and the callout. The
  callout is gold-shadowed parchment text.
- Keep the pause and game-over cards square-cornered. Center the heading.
- In the header, add a subtle warm radial glow behind the title.
- Preview cells:
  `background: linear-gradient(135deg, color-mix(in srgb, var(--piece), white 32%), var(--piece) 50%, color-mix(in srgb, var(--piece), black 28%)); box-shadow: inset 0 0 0 2px #161616;`.

---

## Theme picker swatch (pause menu)

Each option shows a 2×2 mini board drawn in **its own** theme. This tells
players more than a label does.

- Swatch: a 2.25rem square with that theme's `board.background` and
  `swatch-ring`. Inside are 4 cells in a 2×2 grid, colored I, O, T, and Z from
  that theme's palette, with the theme's preview-cell CSS decoration.
- Label: the theme name in that theme's `font-display`, at 0.75rem.
- Selected option: 2 px ring in the active `--bd-accent`, bold label, and a
  small ✓ glyph (`aria-hidden`).
- Order: Classic, Tron, Chocolate, Nature, Sketchbook, Stained Glass. Use one
  stacked column.

## Review checklist (phone, 390×844, for each theme)

- [ ] All seven pieces can be told apart at a glance, including the dark,
      milk, and white chocolates.
- [ ] The landing preview cannot be mistaken for a locked piece.
- [ ] The clear effect is readable, stays inside the board, does not stutter,
      and feels like the theme's own effect.
- [ ] On phone, there is visible spacing between the HUD and playfield.
- [ ] A 10-line milestone popup is readable, uses the active theme, and does
      not cover the centered line-clear callout.
- [ ] The HUD, controls, pause card, picker, game-over card, Help dialog,
      callouts, and page background all look like one world.
- [ ] Focus rings are visible. Disabled controls read as disabled.
- [ ] Classic is pixel-identical to the pre-change screenshots.
