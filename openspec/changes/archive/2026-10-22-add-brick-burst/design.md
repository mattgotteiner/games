## Context

Block Drop is the only game. Its structure is the pattern to follow:

- `rules.ts` holds pure, seeded, deterministic state transitions.
- `controller.ts` owns the animation frame, input timing, Canvas drawing,
  resize observation, and cosmetic effects.
- `BlockDrop.tsx` owns the DOM chrome: header, HUD, pause and game-over
  overlays, Help dialog, controls, the live region, and persistence.
- `themes.ts` and `theme-renderers/` provide the Canvas look and the `--bd-*`
  CSS tokens.

Most chrome CSS in `app.css` is not scoped to `.block-drop`. The following
classes all read `var(--bd-*, <Classic literal>)`:

- `.game-header`, `.session-action`, and `.game-hud`
- `.hud-label` and `.status-dot`
- `.game-overlay`, `.game-overlay-card`, and `.overlay-actions`
- `.game-over-scores` and `.new-best-indicator`
- `.pause-difficulty` and `.difficulty-ticks`
- `.help-dialog`, `.button-primary`, `.button-secondary`, and
  `.visually-hidden`

Only the root `.block-drop` rule, its `:focus-visible` color, the
`button *` selection guard, and theme decorations are scoped. A second game
can therefore reuse the chrome by setting the same tokens on its root.

`game-navigation.ts` hard-codes `GameId = 'block-drop'`. `App.tsx`
hard-codes the single catalog card and the `1 game` count.

The art direction is in `art-direction.md`, and a runnable reference is in
`art-direction/preview.html`. **Treat both as the visual source of truth.**
If this document and the preview disagree on a pixel detail, follow
`art-direction.md`.

## Goals / Non-Goals

**Goals:**

- A complete, polished brick breaker that feels at home on a phone and
  matches the catalog's look.
- Deterministic, pure rules with thorough unit tests, as in Block Drop.
- Good thumb control: a relative drag anywhere on the playfield, not a tiny
  paddle you must touch.
- Reuse Block Drop's chrome and tokens instead of copying them, and extract
  only the helpers that both games now duplicate.
- Prepare a clear path for Brick Burst themes later.

**Non-Goals:**

- Power-ups, multi-ball, lasers, or moving bricks.
- Unbreakable bricks. Every layout must be clearable.
- Themes for Brick Burst in this change. Classic only (see §8).
- Sound or music.
- A general game registry or runtime. `App.tsx` keeps an explicit switch.
- Renaming the `--bd-*` token prefix. It becomes the shared chrome prefix in
  practice. Renaming it is a separate cleanup.
- High-score tables, levels beyond the repeating five, or a level editor.
- Tilt or gyroscope steering.

## Decisions

### 1. Module layout

```
src/games/brick-burst/
  rules.ts            pure state, actions, step(), events
  levels.ts           the five layouts and row colors/points
  controller.ts       frame loop, fixed-step accumulator, input → actions, effects, drawing
  renderer.ts         Canvas recipes from art-direction.md (Classic)
  palette.ts          Classic game-object colors + chrome tokens
  BrickBurst.tsx      DOM chrome, persistence, live region
  brick-burst.css     layout and game-specific chrome (control bar, lives pips, serve hint)
  *.test.ts(x)
src/games/shared/
  storage.ts          readStored / writeStored
  haptics.ts          vibrate(pattern, { reducedMotion })
  use-page-color.ts   html attribute + --bd-page + meta theme-color, restored on unmount
```

### 2. Rules and state

All distances are logical units. The playfield is 384 × 576, with the origin
at the top left and y increasing downward.

```ts
export const FIELD_WIDTH = 384, FIELD_HEIGHT = 576
export const COLUMNS = 12, ROWS = 8, BRICK_W = 32, BRICK_H = 16, BRICKS_TOP = 64
export const PADDLE_W = 64, PADDLE_H = 10, PADDLE_TOP = 536, PADDLE_SPEED = 420
export const BALL_R = 5, BASE_SPEED = 300, STEP_MS = 1000 / 240
export const NUDGE = 24, BALL_LOST_MS = 600, LEVEL_CLEAR_MS = 900

export type BrickBurstDifficulty = 'easy' | 'medium' | 'hard'   // 0.75 / 1 / 1.25
export type BrickKind = 'normal' | 'tough'
export interface Brick { readonly kind: BrickKind; readonly damaged: boolean }
export type Status = 'serving' | 'playing' | 'paused' | 'ball-lost' | 'level-clear' | 'over'

export interface BrickBurstState {
  readonly rng: number                    // mulberry32 state, used only for serve angles
  readonly status: Status
  readonly resumeStatus: Status | null    // status to return to after pause
  readonly level: number
  readonly score: number
  readonly lives: number
  readonly difficulty: BrickBurstDifficulty          // applies from the next serve
  readonly activeSpeedMultiplier: number             // locked at serve
  readonly bricks: ReadonlyArray<Brick | null>       // ROWS × COLUMNS, row-major
  readonly paddleX: number                           // paddle center
  readonly steer: -1 | 0 | 1
  readonly ball: { x: number; y: number; vx: number; vy: number; speed: number }
  readonly serveAngle: number                        // radians from vertical; + is right
  readonly rallyHits: number
  readonly feedbackMs: number                        // remaining ball-lost / level-clear time
}

export type BrickBurstAction =
  | { type: 'steer'; direction: -1 | 0 | 1 }
  | { type: 'paddle-to'; x: number }      // center; clamped
  | { type: 'nudge'; direction: -1 | 1 }  // ±NUDGE, for keyboard/AT button activation
  | { type: 'serve' } | { type: 'pause' } | { type: 'resume' } | { type: 'restart' }
  | { type: 'set-difficulty'; difficulty: BrickBurstDifficulty }

export type BrickBurstEvent =
  | { type: 'brick-hit'; row: number; col: number; kind: BrickKind; broken: boolean;
      points: number; impactX: number; impactY: number; ballVx: number; ballVy: number }
  | { type: 'paddle-hit'; x: number; offset: number }
  | { type: 'wall-hit'; side: 'left' | 'right' | 'top' }
  | { type: 'ball-lost'; livesLeft: number }
  | { type: 'level-cleared'; level: number; bonus: number }
  | { type: 'level-started'; level: number }
  | { type: 'game-over'; score: number }

export function createGame(seed: number, difficulty: BrickBurstDifficulty): BrickBurstState
export function applyAction(s: BrickBurstState, a: BrickBurstAction): BrickBurstState
export function step(s: BrickBurstState): { state: BrickBurstState; events: BrickBurstEvent[] }
export function levelSpeed(level: number, difficulty: BrickBurstDifficulty): number
```

Feedback timers (`ball-lost` and `level-clear`) live in the rules state and
count down in `step()`. Freeze timing is therefore deterministic and covered
by rules tests. This is the main difference from Block Drop, whose line-clear
timer lives in the controller. Brick-pop effects do **not** freeze play.
They are purely cosmetic and live in the controller.

**Serve angle.** `createGame` draws the first serve angle. Each later return
to `serving` draws the next one:
`sign = rng() < 0.5 ? -1 : 1; angle = sign · (8° + rng() · 22°)`. The guide
draws `serveAngle`, so players can see it before they serve.

**`step()`**, once per 1/240 s, only in `serving` or `playing`. In
`ball-lost` and `level-clear` it only counts down `feedbackMs`.

1. `paddleX += steer · PADDLE_SPEED · STEP_MS/1000`, clamped to
   `[PADDLE_W/2, FIELD_WIDTH − PADDLE_W/2]`.
2. **Serving:** set `ball = (paddleX, PADDLE_TOP − BALL_R)` and return.
3. Save `prevY`, then add `v · dt` to the ball's position.
4. **Walls:** reflect off the left, right, and top walls. Clamp the ball
   inside and set the sign of the velocity explicitly. Never just negate it,
   so the ball cannot stick to a wall.
5. **Paddle:** if `vy > 0`, `prevY + r ≤ PADDLE_TOP`, `y + r ≥ PADDLE_TOP`,
   and `|x − paddleX| ≤ PADDLE_W/2 + r`, then:
   - set `y = PADDLE_TOP − r`
   - set `offset = clamp((x − paddleX) / (PADDLE_W/2 + r), −1, 1)`
   - set `θ = offset · 60°`
   - set `vx = speed·sin θ` and `vy = −speed·cos θ`
6. **Bricks:**
   - Collect the bricks whose rectangle is within `r` of the ball center
     (closest-point test).
   - Pick one brick: the closest center first, then the larger row, then the
     larger column.
   - Compute the ball's bounding-box overlap with that brick on each axis.
     Reflect on the smaller axis, or on both if they are equal, and push the
     ball out by that overlap.
   - Damage or remove the brick, award points, and emit `brick-hit`.
   - Increase `rallyHits`. Every 8th hit, multiply `speed` by 1.02, capped
     at `1.6 × levelSpeed`, and rescale `v` to the new speed.
7. **Lost:** if `y − r > FIELD_HEIGHT`:
   - Remove a life.
   - Emit `ball-lost`.
   - If lives remain, set status to `ball-lost` with
     `feedbackMs = BALL_LOST_MS`. Otherwise set it to `over` and emit
     `game-over`.
   - Reset `speed` and `rallyHits`, and draw the next serve angle.
8. **Cleared:** if no bricks remain:
   - Award `500 · level`, multiplied by difficulty.
   - Emit `level-cleared`.
   - Set status to `level-clear` with `feedbackMs = LEVEL_CLEAR_MS`.
   - When the countdown ends, load the next layout, increase `level`, center
     the paddle, set status to `serving`, and emit `level-started`.

**No tunneling.** The fastest reachable speed is
`300 × 1.25 × 1.4 × 1.6 = 840 u/s`. That is 3.5 units per step, which is
less than the ball radius (5), a brick's height (16), and the paddle's height
(10). A single step can never cross a whole brick. Add a rules test that
fires the ball at maximum speed at a one-brick layout from many angles and
checks that it always hits.

**No flat loops.** Only serves (at most 30° from vertical) and paddle bounces
(at most 60° from vertical) set the direction. Walls and bricks only reflect
the ball, which keeps the same angle. The path is therefore never closer than
30° to horizontal. Add a property test over many seeds and random inputs.

**`paddle-to`** clamps and sets `paddleX`. It applies in `serving` and
`playing`. Because of the `prevY` check in step 5, moving the paddle under a
ball that is already below the paddle top does not save it.

**Pause.** `pause` saves `resumeStatus` and sets `paused`. It works from
`serving`, `playing`, `ball-lost`, and `level-clear`. `resume` restores the
saved status. `step()` does nothing while paused. The controller also drops
its accumulated time on resume (see §4).

**Scoring.** `points = round(base · multiplier)`, where `base` depends on the
row band:

| Rows | Points |
|---|---|
| 0–1 | 40 |
| 2–3 | 30 |
| 4–5 | 20 |
| 6–7 | 10 |

- A tough brick's first hit uses base 10. Breaking it uses `2 × band`.
- The multiplier is the difficulty multiplier locked at the current serve.
  The level-clear bonus uses the same multiplier.

**Difficulty.** `set-difficulty` updates `difficulty` immediately, and the
HUD shows it. `activeSpeedMultiplier`, which sets ball speed and the score
multiplier, is copied from `difficulty` only when a ball is served. The ball
already in play is therefore unaffected.

### 3. Levels (`levels.ts`)

These are 12 × 8 strings, written top row first. Symbols: `.` is empty, `n`
is a normal brick, and `t` is a tough brick. A brick's color comes from its
**row**, as defined in the art-direction palette. Its points come from the
row band.

```
L1 Stripes      L2 Pyramid      L3 Checker      L4 Fortress     L5 Invader
............    .....tt.....    tntntnntntnt    tttttttttttt    ..t......t..
nnnnnnnnnnnn    ....nnnn....    ntntnttntntn    t..........t    ...n....n...
nnnnnnnnnnnn    ...nnnnnn...    ............    t.nnnnnnnn.t    ..nnnnnnnn..
nnnnnnnnnnnn    ..nnnnnnnn..    nnnn....nnnn    t.nnnnnnnn.t    .nn.nnnn.nn.
nnnnnnnnnnnn    .nnnnnnnnnn.    nnnn....nnnn    t.nnnnnnnn.t    nnnnnnnnnnnn
nnnnnnnnnnnn    nnnnnnnnnnnn    ............    t..........t    n.nnnnnnnn.n
nnnnnnnnnnnn    ............    nn.nn..nn.nn    tttt....tttt    n.n......n.n
............    ............    nn.nn..nn.nn    ............    ...nn..nn...
```

Brick counts are 72, 42, 56, 54, and 50, including 0, 2, 12, 30, and 2
tough bricks. Each layout is left-right
symmetric. A unit test checks the size, the allowed symbols, symmetry, and
that every layout has at least one brick. Level `n` uses layout
`(n − 1) mod 5`.

### 4. Controller

`BrickBurstController(canvas, onState, options)` mirrors
`BlockDropController`. Its options are `seed`, `difficulty`, `initialState`,
`requestFrame`, `cancelFrame`, `createResizeObserver`, `devicePixelRatio`,
`reducedMotion`, and `now`.

- **Fixed-step loop:**
  - Each frame adds the elapsed time, capped at 100 ms, to an accumulator.
  - Before each step, apply all queued actions.
  - Run `step()` while the accumulator holds at least `STEP_MS`.
  - Pass events to the effects system and to `onState(state, events)`.
  - On resume or restart, reset the accumulator and the last-frame
    timestamp. Paused time must never turn into simulation time.
- **Interpolation is not used.** At 240 Hz steps the visual jitter is
  negligible, and drawing the latest state keeps tests simple.
- **Input → actions:**

  | Input | Action |
  |---|---|
  | `keydown`/`keyup` for ←, →, A, D | Track the set of held keys and send `steer(right − left)`. Ignore auto-repeat. Clear it on `blur`. |
  | Space, ↑ | `serve` |
  | P | `pause` or `resume` |
  | R | `restart` |
  | Touch or pen `pointerdown` on the canvas or `.control-bar` background | Start a drag: record `pointerId`, `startX`, `lastX`, and `t0`, then capture the pointer. |
  | `pointermove` (same pointer) | `paddle-to(paddleX + (clientX − lastX) · FIELD_WIDTH / boardCssWidth)` |
  | `pointerup` within 300 ms and less than 10 px of movement, while serving, for a drag that began on the canvas | `serve` |
  | Mouse `pointermove` over the canvas (no button needed) | `paddle-to((clientX − rect.left) · FIELD_WIDTH / boardCssWidth)` |
  | Mouse click on the canvas | `serve` |
  | Left or Right button `pointerdown` | `steer(±1)`; `pointerup`, `pointercancel`, or `lostpointercapture` sends `steer(0)` |
  | Left or Right `click` with `event.detail === 0` (keyboard or AT) | `nudge(±1)` |
  | Serve button `click` | `serve` |

  Only one drag pointer steers at a time. Drags that start on the Left,
  Right, or Serve buttons are not drags; the button handles them. While the
  Left or Right button is held, its steer takes priority over a drag until it
  is released. Combine steering sources by keeping `keyboardSteer` and
  `buttonSteer` separately, and send their sum clamped to −1..1.
- **Effects:**
  - The controller keeps cosmetic effects in a list:
    `brick-pop` (240 ms), `tough-crack-flash` (120 ms), and
    `paddle-flash` (120 ms). Each has `startedAt`, `durationMs`, and the
    event data.
  - It also keeps a trail ring buffer with the last 6 ball positions,
    sampled every 4 steps.
  - The level-clear sweep and the ball-lost glow read
    `state.feedbackMs`, so they need no separate timer.
  - The effects clock stops while paused.
  - With reduced motion, effects are not added and the trail is not drawn.
- **Draw order:**
  1. background
  2. bricks
  3. brick pops
  4. paddle
  5. trail
  6. ball
  7. serve guide (serving only)
  8. ball-lost glow
  9. level-clear sweep
  10. paused or game-over veil
- **Geometry:**
  - Set `scale = boardCssWidth / FIELD_WIDTH`.
  - Call `ctx.setTransform(dpr·scale, 0, 0, dpr·scale, 0, 0)`, so recipes
    draw in logical units.
  - `align(v)` snaps to device pixels: `Math.round(v·dpr·scale)/(dpr·scale)`.
  - Hairlines use `1 / scale` units, which is 1 CSS px.
- **Resize:** a `ResizeObserver` on `.board-frame` fits the largest 2:3
  rectangle and sets the canvas backing size to `css × dpr`. The rules state
  is in logical units, so resizing never moves the paddle logically.

### 5. Renderer

`renderer.ts` exports one `BrickBurstRenderer` object (`classicRenderer`)
that implements:

```ts
export interface BrickBurstRenderer {
  drawBackground(ctx, look: BrickBurstLook): void
  drawBrick(ctx, look, b: { row; col; kind; damaged; seed }): void
  drawPaddle(ctx, look, p: { x: number; flash: number }): void
  drawBall(ctx, look, b: { x; y }, trail: ReadonlyArray<{ x; y }>): void
  drawServeGuide(ctx, look, from: { x; y }, angle: number): void
  drawBrickPop(ctx, look, e: BrickPopDraw, progress: number): void
  drawBallLost(ctx, look, progress: number): void
  drawLevelSweep(ctx, look, progress: number): void
}
```

`BrickBurstLook` is the palette object from `palette.ts`. Renderers follow
Block Drop's rules:

- never call `Math.random()`
- use `hash(x, y, salt)` from `block-drop/theme-renderers/shared.ts`
  (import it; do not copy it)
- no `shadowBlur`, `filter`, or off-screen canvases
- no allocations in the per-brick loop, except gradients
- a brick's seed is `hash(col, row)`

### 6. Chrome, tokens, and CSS

- `BrickBurst.tsx` renders
  `<main class="brick-burst" data-theme="classic" style={tokens}>`. `tokens`
  is `BLOCK_DROP_THEMES.classic.tokens`, written as `--bd-*` custom
  properties. The shared chrome classes therefore render exactly as they do
  in Block Drop Classic.
- Reuse these class names and their DOM structure as they are:
  - `game-header` and `session-action`
  - `game-hud`, `game-score`, `game-score-value`, and `hud-label`
  - `game-progress-item` and `status-dot` (with `status-*` modifiers)
  - `board-frame`, `board-surface`, and `game-overlay`
  - `pause-overlay`, `game-over-overlay`, and `game-overlay-card`
  - `overlay-actions`, `game-over-scores`, and `new-best-indicator`
  - `pause-difficulty` and `difficulty-ticks`
  - `help-dialog` and its children
  - `button-primary`, `button-secondary`, and `visually-hidden`
  - `line-clear-callout`, for the "Level N" callout
- Broaden the three root-scoped rules in `app.css` from `.block-drop` to
  `:is(.block-drop, .brick-burst)`: the root layout and font,
  `:focus-visible`, and the `button *` selection guard. Do **not** broaden
  the `[data-theme=…]` decorations. Brick Burst is always Classic in this
  change.
- `brick-burst.css` holds only what is new:
  - `.control-bar` (Left, Serve, Right), with 56 px minimum targets and
    `touch-action: none`
  - `.board-frame` 2:3 sizing and `touch-action: none`
  - `.lives` pips
  - `.serve-hint`, the DOM pill "Drag to aim · tap to serve" shown above
    the paddle while serving
  - the portrait HUD strip arrangement

  It must use only `var(--bd-*)` values, with no new literal colors, except
  the semantic status-dot colors that already exist.
- **Page color:** `use-page-color.ts` is extracted from Block Drop's current
  effect. It takes an attribute name, so Block Drop keeps
  `data-block-drop-theme`. Brick Burst uses `data-brick-burst-theme`. Add a
  matching `global.css` pair:
  `html[data-brick-burst-theme], html[data-brick-burst-theme] body { background: var(--bd-page); }`.
  The meta `theme-color` is Classic's `#162033`.

### 7. Persistence

Use `shared/storage.ts`:

```ts
export function readStored<T>(key: string, parse: (raw: string) => T | undefined, fallback: T): T
export function writeStored(key: string, value: string): void   // try/catch, ignore errors
```

| Key | Validation | Fallback |
|---|---|---|
| `games.brick-burst.best-score` | Non-negative safe integer | `0` |
| `games.brick-burst.difficulty` | `'easy'`, `'medium'`, or `'hard'` | `'medium'` |

Block Drop's `readBestScore`, `readDifficulty`, and `readTheme` are
rewritten on top of `readStored`. Their keys and behavior do not change, and
the existing tests must pass unchanged.

### 8. Readiness for Brick Burst themes (follow-up, not built here)

The Block Drop themes work shows the pattern. To let a later change add
Brick Burst themes without rewrites:

- `BrickBurstLook` mirrors `BlockDropTheme`: `id`, `label`, `bricks` (8 row
  colors), `paddle`, `ball`, `board`, `metaThemeColor`, and `tokens`.
  `palette.ts` exports `BRICK_BURST_LOOKS = { classic }`.
- The controller and component read only `look`, never literal colors.
- `art-direction.md` §"Theme mapping" sketches how each Block Drop world maps
  to bricks. The follow-up decides whether the two games share one theme
  preference.

### 9. Navigation and catalog

- `GameId = 'block-drop' | 'brick-burst'`. `parseGameUrl` accepts both, using
  a `SUPPORTED_GAMES` set.
- `App.tsx` adds a `view === 'brick-burst'` branch that renders
  `<BrickBurst controllerFactory={brickBurstControllerFactory} />`. The
  `brickBurstControllerFactory` prop is used for tests, like Block Drop's.
- The second catalog card has the kicker **Arcade**, the title
  **Brick Burst**, the description *"Bounce a bright ball through walls of
  candy-colored bricks."*, and the button **Play Brick Burst**. The count
  becomes `2 games`.
- `app-shell` gets `game-shell` for either game.

### 10. Announcements and haptics

| Event | Announcement | Vibration |
|---|---|---|
| `level-started` | "Level N. Tap or press Space to serve." | — |
| `brick-hit` | — | 8 ms when `broken` |
| `ball-lost` | "Ball lost. N lives left." | 40 ms |
| `level-cleared` | "Level N cleared. Score S." | `[20, 40, 20]` |
| `game-over` | "Game over. Score S." | — |
| Pause / resume | "Paused" / "Resumed" | — |

`shared/haptics.ts` holds the support and reduced-motion guard that Block
Drop's `vibrateForGameEvent` uses today. Block Drop calls it with its own
durations, which do not change.

## Risks / Trade-offs

- **Steering feel is the product.** A relative drag at 1:1 may feel slow on
  a narrow phone. Crossing the field takes a drag of one full board width.
  Mitigation: tasks 6.6 and 6.7 require a phone review. If the review asks
  for it, a follow-up can add a 1.25× gain. Do not add acceleration curves
  now.
- **Fingers cover the bottom of the playfield.** Because the drag is
  relative, the thumb can rest on the control bar below the field, so no
  touch has to be on the paddle. The serve hint teaches this.
- **Floating-point determinism.** Replays are deterministic within one JS
  engine, which is the guarantee the tests need. Different engines may differ
  in the last bit. That is acceptable, because nothing is replayed across
  devices.
- **240 Hz stepping cost.** A 100 ms catch-up runs 24 steps of at most 96
  brick checks each, which is trivial. The 100 ms cap prevents a death
  spiral after a long frame.
- **Tunneling at corners.** The single-brick-per-step rule plus
  smallest-overlap reflection can occasionally reflect the "wrong" way at an
  exact corner. This is accepted, because it is how classic brick breakers
  behave. It is deterministic and tested.
- **Shared chrome coupling.** Block Drop theme decorations are scoped to
  `.block-drop[data-theme=…]`, so they cannot leak into Brick Burst. Changes
  to shared chrome classes now affect both games. That coupling is the
  intended reuse. Add one Brick Burst component snapshot of the pause card to
  catch accidental drift.
- **Extracting helpers from Block Drop** could regress it. Each extraction
  is a separate task with Block Drop's tests run before and after.

## Migration Plan

1. Extract `shared/storage.ts`, `haptics.ts`, and `use-page-color.ts`, and
   switch Block Drop to them. All tests stay green, with no visible change.
2. Add `levels.ts` and `rules.ts` with full unit tests. No UI yet.
3. Add `palette.ts`, `renderer.ts`, and the controller. Compare the drawing
   with `preview.html`.
4. Add `BrickBurst.tsx`, `brick-burst.css`, the CSS selector broadening, and
   the page-color hook.
5. Add the navigation and catalog entry, then the E2E flows.
6. Run `npm run check` and do a phone review.
