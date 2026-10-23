# Brick Burst: Art Direction

This document is the visual source of truth for Brick Burst. Read
`art-direction/preview.html` with it. That file is a runnable sketch of every
recipe and effect described here: the resting field, serving, a rally, brick
pops, a tough-brick crack, ball loss, a level-clear sweep, all five layouts,
and a phone-frame mock of the chrome. Its drawing code can be ported almost
directly into `renderer.ts`.

All Canvas measurements are in **logical units** (the field is 384 × 576)
unless they say "CSS px". One CSS px is `1 / scale` units, where
`scale = boardCssWidth / 384`. At 390 × 844, `scale ≈ 0.95`.

## Principles

1. **Same family as Block Drop Classic.** The two games should look like two
   cartridges for the same console. They share the midnight board, the
   candy palette, the bevelled cells, the cyan accent, and all the chrome.
   Players coming from Block Drop should feel at home immediately.
2. **The ball is the brightest thing on screen.** Nothing else is pure
   white at rest. The eye must find the ball instantly, even in peripheral
   vision, while the player watches the paddle.
3. **Breaking a brick is the signature moment.** It gets the boldest motion,
   but it is short (240 ms) and never hides the ball.
4. **Calm field.** No moving background, no screen shake, no flashing of
   the whole board. Motion belongs to the ball, the paddle, and breaking
   bricks.
5. **Procedural only.** Canvas paths, gradients, and CSS. No images,
   sprites, or web fonts.
6. **Deterministic.** Every fragment, crack, and offset comes from
   `hash(x, y, salt)`. Nothing flickers between frames.
7. **Damage is a shape, not a color.** Tough bricks read as different
   because of their rim and rivets. Cracked tough bricks read as damaged
   because of a crack line and a missing rivet.

## Concept

**Classic: a midnight arcade.** The field is the same deep navy as Block
Drop, with a faint 32-unit grid that hints at Block Drop's playfield. Rows of
glossy bevelled bricks cross the top in rainbow order. Below them are a
bright cyan paddle and a white comet ball with a short cyan trail. A faint
rose glow at the bottom edge marks the danger zone. Keywords: *arcade
cabinet, candy bricks, comet, neon cyan, midnight*.

---

## Palette (`palette.ts`, `BRICK_BURST_LOOKS.classic`)

### Chrome tokens

The chrome uses `BLOCK_DROP_THEMES.classic.tokens`, unchanged. Import it;
never copy values. The table below lists only the tokens that Brick Burst's
new chrome (`brick-burst.css`) uses, for reference.

| Token | Used for in Brick Burst |
|---|---|
| `text` | Score, headings, button captions |
| `text-muted` | Serve hint text, hollow (lost) life pips, `Lives` caption |
| `label` | HUD labels (`SCORE`, `LEVEL`, `LIVES`) |
| `accent` | Live life-pip halo, focus-adjacent highlights |
| `panel` / `panel-bg` / `panel-border` | HUD strip, serve-hint pill background (`panel` at 88%) |
| `control-bg` / `control-border` / `control-text` | Left and Right buttons |
| `primary-bg` / `primary-text` | Serve button |
| `focus` | Focus rings (via the broadened `:focus-visible` rule) |
| `board-ring` / `board-shadow` / `board-backdrop` | `.board-surface` frame, unchanged |
| `scrim` | Pause and game-over overlay |
| `callout-text` / `callout-shadow` | "Level N cleared" callout |
| `page` | Page background (`use-page-color`) |

`metaThemeColor` is `#162033`, the same as Block Drop Classic.

### Field (Canvas)

| Name | Value | Use |
|---|---|---|
| `field` | `#07111f` | Base fill |
| `fieldGlow` | `#10223a` | Radial highlight centered at (50%, 30%), fading to `field` at 70% of the field height |
| `grid` | `rgb(148 163 184 / 6%)` | 32 × 32-unit grid, 1 CSS px, aligned to brick columns |
| `danger` | `rgb(251 113 133 / 12%)` | Bottom 28 units: a linear gradient from transparent to this |
| `pausedVeil` | `rgb(7 17 31 / 84%)` | Same as Block Drop Classic |
| `gameOverVeil` | `rgb(7 17 31 / 76%)` | Same as Block Drop Classic |

### Bricks by row

Row 0 is the top row. These colors are Block Drop Classic's piece colors in
rainbow order, plus one teal to fill eight rows.

| Row | Name | Color | Block Drop origin | Points |
|---|---|---|---|---|
| 0 | Rose | `#fb7185` | Z | 40 |
| 1 | Orange | `#fb923c` | L | 40 |
| 2 | Yellow | `#facc15` | O | 30 |
| 3 | Green | `#4ade80` | S | 30 |
| 4 | Teal | `#2dd4bf` | *(new)* | 20 |
| 5 | Sky | `#38bdf8` | I | 20 |
| 6 | Indigo | `#818cf8` | J | 10 |
| 7 | Violet | `#c084fc` | T | 10 |

### Paddle and ball

| Name | Value |
|---|---|
| `paddleTop` | `#a5f3fc` |
| `paddleMid` | `#67e8f9` (= `accent`) |
| `paddleBottom` | `#22d3ee` |
| `paddleOutline` | `rgb(7 17 31 / 55%)` |
| `paddleGrip` | `rgb(7 17 31 / 35%)` |
| `ball` | `#f8fafc` |
| `ballHalo` | `rgb(103 232 249 / 35%)` |
| `trail` | `#67e8f9` (alpha per step, see below) |
| `guide` | `#67e8f9` |
| `crack` | `rgb(248 250 252 / 85%)` |
| `rivet` | `rgb(248 250 252 / 70%)` |

---

## Canvas recipes

### Background

1. Fill the field with `field`.
2. Fill a radial gradient from `fieldGlow` at (192, 172), radius 0, to
   `field` at radius 400.
3. Draw a 1 CSS px `grid` line every 32 units, both ways. Snap the lines
   with `align()`.
4. Draw the `danger` band over the bottom 28 units (y 548 to 576), a linear
   gradient from transparent to `danger`.

### Normal brick

The brick occupies `x = col·32`, `y = 64 + row·16`, `w = 32`, and `h = 16`.

1. Inset the brick by `g = 1` unit on every side. This reveals the dark
   field as mortar between bricks.
2. Fill the inset rectangle with the row color.
3. Bevel, with `e = max(1 CSS px, 1.6)` units:
   - Top and left strips of width `e`: `rgb(255 255 255 / 28%)`.
   - Bottom and right strips of width `e`: `rgb(0 0 0 / 22%)`.

   This is Block Drop Classic's cell bevel, stretched to 2:1.
4. Shine: a 1 CSS px line `rgb(255 255 255 / 18%)` from `x + 4` to
   `x + 14`, at `y + g + e + 1.2`. It is a small glint on the leading edge.

### Tough brick

1. Inset by `g = 1` as above. Fill with `mix(rowColor, field, 0.45)`, a dark
   version of the row color.
2. Rim: stroke the rectangle inset by `g + 1.2`, using the row color,
   `lineWidth 2.4`.
3. Apply the same bevel as a normal brick, on top.
4. Rivets: two circles of radius 1.6 in `rivet`, at `(x + 6, y + 8)` and
   `(x + 26, y + 8)`.
5. **Damaged** (after the first hit):
   - Draw the rim at 60% alpha.
   - Do not draw the right rivet.
   - Draw the crack: a 1 CSS px `crack` polyline.
     - Start at an origin near the center:
       `(x + 16 + (hash(col,row,1) − 0.5)·8, y + 8 + (hash(col,row,2) − 0.5)·4)`.
     - Draw three branches from the origin:
       - one to the top edge at `x + 6 + hash(col,row,3)·20`
       - one to the bottom edge at `x + 6 + hash(col,row,4)·20`
       - one toward the nearer side wall, ending 4 units short of it
     - Give each branch one midpoint kink, offset perpendicular by
       `(hash(col,row,5+k) − 0.5)·3`.

   With reduced motion, the crack still shows. It is state, not motion.

### Paddle

The paddle is a capsule centered at `paddleX`, with its top at y = 536,
`w = 64`, `h = 10`, and radius 5.

1. Fill with a vertical gradient: `paddleTop` at 0, `paddleMid` at 0.5, and
   `paddleBottom` at 1.
2. Highlight: a line in `rgb(255 255 255 / 70%)`, `lineWidth 1.2`, from
   `left + 6` to `right − 6` at `top + 2.2`, with round caps.
3. Grip: two 1 CSS px vertical lines in `paddleGrip`, at `paddleX ± 3`, from
   `top + 3.5` to `top + 7.5`. They mark the center, which sends the ball
   straight up.
4. Outline: a 1 CSS px stroke in `paddleOutline`.

### Ball and trail

1. **Trail** (skipped with reduced motion): 6 earlier positions, sampled
   every 4 simulation steps, newest first. For `i = 0..5`, draw a circle of
   radius `5·(0.85 − i·0.12)`, filled with `trail` at alpha
   `0.30 − i·0.045`.
2. **Halo:** a circle of radius 6.5, stroked in `ballHalo` with
   `lineWidth 3`. This is a fake glow, without `shadowBlur`.
3. **Body:** a circle of radius 5, filled with `ball`.
4. **Specular highlight:** a circle of radius 1.4 at `(−1.6, −1.6)` from the
   center, filled with white.

### Serve guide (serving only)

Seven dots of radius 1.4 in `guide`. They start 12 units from the ball
center and are spaced 10 units apart along `serveAngle`. Alpha fades from
0.75 for the nearest dot to 0.15 for the farthest. The dots are static, not
animated, so the guide is calm.

---

## Effects

The active pacing uses a base ball speed of 390 units/s and held paddle speed
of 540 units/s. The recipes below use normalized progress: ball loss spans
400 ms, and the level-clear sweep plus settle spans 650 ms. The DOM callout
uses the same level-clear duration as the rules. Brick pops and hit flashes
retain their original durations.

| Effect | Trigger | Duration | Freezes play? |
|---|---|---|---|
| Brick pop | `brick-hit` with `broken` | 240 ms | No |
| Crack flash | `brick-hit` on a tough brick, not broken | 120 ms | No |
| Paddle flash + ripple | `paddle-hit` | 120 ms | No |
| Layout fade-in | `level-started` | 160 ms + 30 ms per row | No (serving) |
| Ball lost | status `ball-lost` | 400 ms | Yes (rules) |
| Level sweep | status `level-clear` | 650 ms | Yes (rules) |

With reduced motion, Brick Burst does not draw the pop, flash, ripple,
fade-in, trail, or sweep. The ball-lost effect draws only the static dimmed
paddle. The DOM callout still appears without movement.

### Brick pop "Burst" (240 ms)

The broken brick is already gone from the state. The effect redraws it from
its event data, for progress `p` from 0 to 1.

- **Flash, 0 to 20%:** draw the brick with the normal recipe, then fill it
  with white at alpha `0.85·(p/0.2)`. Scale it from its center by
  `1 + 0.06·(p/0.2)`.
- **Ring, 0 to 50%:** draw a 1 CSS px white stroke around the brick
  rectangle, expanded by `4·ease(p/0.5)` units, at alpha `0.5·(1 − p/0.5)`.
- **Fragments, 20 to 100%:** let `q = (p − 0.2)/0.8`. Split the brick into
  a 3 × 2 grid of 6 fragments, each about 10.7 × 8 units. For fragment `k`,
  with center `c` and direction `d = normalize(c − impact)`:
  - `dx = d.x·14·ease(q) + sign(ballVx)·6·q + (hash(col,row,k) − 0.5)·8·q`
  - `dy = d.y·10·ease(q) + 26·q² − 6·hash(col,row,k+6)·q`. The fragments
    pop away from the ball, then fall.
  - Rotate by `(hash(col,row,k+12) − 0.5)·2.4·q`, scale by `1 − 0.35·q`, and
    use alpha `1 − q`.
  - Fill with `mix(rowColor, #ffffff, 0.15)`, with no bevel.
- A tough brick that breaks uses its dark body color for the fragments,
  plus a single bright rim-colored fragment. That makes "the armor came off"
  readable.

The board clip keeps fragments inside the field.

### Crack flash (120 ms)

Draw the rim in white at alpha `0.8·(1 − p)` over the damaged tough brick.
The crack itself appears at once, as state.

### Paddle flash and ripple (120 ms)

- Draw a white overlay on the paddle capsule at alpha `0.45·(1 − p)`.
- Draw a ripple: an upper half-arc at the contact x, at `top − 1`. Its
  radius goes from 3 to 10 units. Use `paddleTop` at alpha `0.5·(1 − p)`,
  with a 1 CSS px stroke.

### Layout fade-in

Row `r` starts after `30·r` ms and fades from alpha 0 to 1 over 160 ms. It
also slides down from `−6` units to 0 with `ease`. Serving is allowed
throughout, because the bricks already exist logically.

### Ball lost (400 ms, `p = 1 − feedbackMs/400`)

- Draw a bottom glow: a linear gradient over the bottom 80 units, from
  transparent to `rgb(251 113 133 / {0.35·sin(p·π)})`.
- Draw the paddle at alpha `1 − 0.6·sin(p·π)`, so it dims and recovers.
- Do not draw the ball.
- In the DOM, the lost life pip shrinks and fades over 300 ms through a CSS
  transition. Skip the transition with reduced motion.

### Level sweep (650 ms, `p = 1 − feedbackMs/650`)

- **Sweep, 0 to 60%:** a band of light 48 units tall moves from y = −48 to
  y = 576. Its vertical gradient goes from transparent to
  `rgb(165 243 252 / 28%)` to transparent.
- In the DOM, the `.line-clear-callout` shows **"Level N cleared"** with its
  existing animation.
- **Settle, 60 to 100%:** the paddle glides back to the center, drawn from
  its current x with `ease`. This is cosmetic only. The rules reset
  `paddleX` when the next level starts.

---

## Chrome and layout

Brick Burst reuses Block Drop's chrome classes and Classic tokens (design
§6). Only these elements are new.

### Phone portrait (390 × 844)

```
┌──────────────────────────────────┐
│ Brick Burst                [Pause]│  game-header (same as Block Drop)
├──────────────────────────────────┤
│ SCORE 12,480 │ LVL 3 │ ●●○ │ ● Play │  HUD strip (one row)
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ ▆▆▆▆▆▆▆▆▆▆▆▆  rose           │ │
│ │ ▆▆▆▆▆▆▆▆▆▆▆▆  orange         │ │
│ │ …                            │ │  board-frame, 2:3, ≥ 520 px tall
│ │            ●                 │ │
│ │                              │ │
│ │    ( Drag to move · tap to serve )  serve hint (serving only)
│ │          ═══════             │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ [ ◀ Left ]  [ Serve ]  [ Right ▶ ]│  control-bar, 56 px targets
└──────────────────────────────────┘
```

- **Lives pips:** three 0.7rem circles. A live pip is filled with `ball`,
  with a 2 px `accent` halo (`box-shadow: 0 0 0 2px` at 35% alpha). A lost
  pip is hollow, with a 1.5 px `text-muted` border. The group has
  `role="img"` and `aria-label="2 lives"`. A visually hidden text copy also
  sits in the HUD for screen-reader browsing.
- **Serve hint:** a pill centered horizontally, 18% of the board height
  above the bottom edge. It uses `panel` at 88% alpha, `text-muted` text at
  0.8rem / 600 weight, and a 999px radius. The text is "Drag to move · tap to
  serve" under `(pointer: coarse)`, and "← → to move · Space to serve"
  otherwise. It is `aria-hidden`, because the live region already announces
  serve readiness. Set `pointer-events: none`, so it never blocks a tap.
- **Control bar:**
  - Three buttons in a row: Left and Right take `flex: 1`, and Serve takes
    `flex: 1.2`.
  - Left and Right use the existing gameplay control styles
    (`control-*` tokens) and the ◀ and ▶ symbols with captions.
  - Serve uses `button-primary`. When unavailable, it uses the existing
    disabled treatment, which shows a dashed border, not just reduced
    opacity.
  - The gaps between the buttons are drag surface. A thumb that lands
    between buttons steers.
- **Header:** the title "Brick Burst" in `font-display`. Pause is the only
  header session action, as in Block Drop. Help is reached from the pause
  card.

### Wide layout (≥ 720 px wide with room)

The board is on the left, and the HUD column is on the right, as in Block
Drop. The HUD shows a large Score, then Level, Lives, and Difficulty, the
status, and then the keyboard reference (`← → / A D move · Space serve ·
P pause · R restart`). The control bar stays below the board, so touch
laptops still work.

### Pause and game-over cards

These match Block Drop exactly: the same card, the same Difficulty slider
with Easy, Medium, and Hard ticks, and the same Restart, Help, and Resume
order. The game-over card shows **Final score**, **Best**, and an optional
**New best** badge, with `Play again` focused.

### Help dialog content

1. **How to play.** "Keep the ball in play with your paddle and break every
   brick. Where the ball hits the paddle sets its angle: the center sends it
   straight up and the ends send it sideways. Tough bricks have rivets and
   take two hits. You have three balls."
2. **Scoring.** A table of the row bands (40, 30, 20, 10), the tough-brick
   rule, the level bonus (500 × level), and the difficulty multiplier.
3. **Controls.** Touch, mouse, and keyboard, one line each.

---

## Theme mapping (for the follow-up change, not built here)

Each Block Drop world maps naturally onto bricks. The future renderer reuses
that theme's cell recipe, stretched to 2:1, and a scaled-down version of its
line clear as the brick pop.

| Theme | Brick | Paddle | Ball | Brick pop |
|---|---|---|---|---|
| Tron | Hollow neon bar | Light-cycle bar with a glowing core | White core with a cyan glow ring | Derez slices slide sideways |
| Chocolate | Embossed bar segment | Gold-foil wafer | Round truffle | Bar softens and drips |
| Nature | Smooth river stone | Driftwood | Pebble | Stone turns into a leaf and drifts down |
| Sketchbook | Hatched pencil box | Ruler | Inked circle | Eraser smudge and crumbs |
| Stained Glass | Leaded pane | Gilded bar | Clear glass bead | Pane cracks and shatters |

---

## Review checklist (phone, 390 × 844)

- [ ] The ball is found instantly in every state, including over yellow
      and teal bricks.
- [ ] All eight row colors are distinct, and tough bricks read as tough
      without relying on color.
- [ ] A cracked tough brick reads as damaged at a glance.
- [ ] Brick pops feel punchy, never hide the ball, and stay inside the
      field.
- [ ] A thumb drag from the control bar steers precisely, and the page
      never scrolls.
- [ ] A tap serves; a drag never serves by accident.
- [ ] The serve guide is visible but calm.
- [ ] Losing a ball is clear but not alarming. The lost pip is obvious.
- [ ] The level sweep and callout feel like a reward.
- [ ] The HUD, pause card, game-over card, Help dialog, and page background
      match Block Drop Classic.
- [ ] Focus rings are visible, and a disabled Serve reads as disabled.
- [ ] With reduced motion, there is no trail, pop, sweep, or fade-in, and
      the game is fully playable.
