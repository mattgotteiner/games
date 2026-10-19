## Context

The playfield is drawn by `BlockDropController.draw()` in `controller.ts`. It
uses hard-coded colors and `TETROMINO_COLORS` from `piece-metadata.ts`. The
line-clear effect is a 180 ms white flash (`LINE_CLEAR_MS`). Hold and Next
previews are DOM cells styled with an inline `backgroundColor`. The page
chrome (HUD, overlays, controls, and Help) uses about 100 literal colors in
`app.css`.

Difficulty already has a matching pattern: a pause-menu control,
`localStorage` persistence with validation (`readDifficulty` and
`writeDifficulty` in `BlockDrop.tsx`), and a controller setter. Themes follow
the same pattern.

The art direction for every theme is in `art-direction.md`. A runnable
reference sketch is in `art-direction/preview.html`; open it directly in a
browser. **Treat both as the visual source of truth.** If this document and
the preview disagree on a pixel detail, follow `art-direction.md`.

## Goals / Non-Goals

**Goals:**

- Provide six cohesive, purely cosmetic themes. The default, Classic, must
  stay visually identical to today's game.
- Give each theme its own line-clear animation.
- Keep one source of truth for theme values, shared by Canvas and CSS.
- Add the picker to the pause menu, persist the choice, and restore it on
  launch.
- Remove literal colors from Block Drop CSS and the controller.

**Non-Goals:**

- Sound, music, or haptic changes per theme.
- Themed lock, rotation, level-up, or game-over animations. These are possible
  follow-ups once the renderer interface exists.
- Theming the catalog page.
- Images, sprites, or web fonts.
- Following the OS light or dark preference automatically.
- Renaming pieces per theme, such as "Dark chocolate bar". Accessible names
  stay `I tetromino` and similar names.
- Using a URL parameter for the theme. `?theme=` already appears in navigation
  tests as an unrelated preserved parameter, so do not read it.

## Decisions

### 1. Theme data lives in TypeScript (`themes.ts`)

Create `src/games/block-drop/themes.ts`:

```ts
export type BlockDropThemeId =
  | 'classic' | 'tron' | 'chocolate' | 'nature' | 'sketchbook' | 'stained-glass'

export const BLOCK_DROP_THEME_ORDER: ReadonlyArray<BlockDropThemeId> = [
  'classic', 'tron', 'chocolate', 'nature', 'sketchbook', 'stained-glass',
]

export interface BlockDropTheme {
  readonly id: BlockDropThemeId
  readonly label: string            // "Stained Glass"
  readonly pieces: Readonly<Record<Tetromino, string>>   // #rrggbb only
  readonly board: {
    readonly background: string
    readonly grid: string
    readonly gridWidth: number      // CSS px; scaled by renderer
    readonly pausedVeil: string     // replaces 'rgb(7 17 31 / 84%)'
    readonly gameOverVeil: string   // replaces 'rgb(7 17 31 / 76%)'
  }
  readonly clearMs: number          // 360..840 (twice the original timings)
  readonly metaThemeColor: string
  readonly tokens: Readonly<Record<BlockDropToken, string>>  // see §3
}

export const BLOCK_DROP_THEMES: Readonly<Record<BlockDropThemeId, BlockDropTheme>>
export function isBlockDropThemeId(value: unknown): value is BlockDropThemeId
```

Copy every value from the tables in `art-direction.md`. Classic must reuse
the existing literals exactly. Keep `TETROMINO_COLORS` in `piece-metadata.ts`
as an alias of `BLOCK_DROP_THEMES.classic.pieces`, or delete it once nothing
imports it.

The theme is **not** part of `BlockDropState`. The rules state must stay
deterministic and independent of cosmetics. "Persisted in game state" means
the component and controller hold the selected theme, and the device
preference saves it, just as difficulty is restored on launch.

### 2. Canvas renderers per theme

Create `src/games/block-drop/theme-renderers/`:

```
shared.ts         hash(x, y, salt), mix(hex, hex, t), alpha(hex, a), ease, clamp01, roundRect, align
classic.ts        current drawCell/drawGhostCell + flash (moved from controller)
tron.ts
chocolate.ts
nature.ts
sketchbook.ts
stained-glass.ts
index.ts          export const THEME_RENDERERS: Record<BlockDropThemeId, ThemeRenderer>
```

```ts
export interface BoardGeometry {
  readonly cell: number; readonly offsetX: number; readonly offsetY: number
  readonly width: number; readonly height: number; readonly ratio: number
}
export interface CellDraw extends BoardGeometry {
  readonly x: number; readonly y: number      // board column/row
  readonly type: Tetromino
  readonly seed: number                       // texture seed, see below
}
export interface LineClearDraw extends BoardGeometry {
  readonly rows: ReadonlyArray<number>
  readonly board: Board                        // pre-clear board (event.board)
  readonly progress: number                    // 0..1
}
export interface ThemeRenderer {
  drawBackground(ctx: CanvasRenderingContext2D, theme: BlockDropTheme, g: BoardGeometry): void
  drawCell(ctx: CanvasRenderingContext2D, theme: BlockDropTheme, c: CellDraw): void
  drawGhostCell(ctx: CanvasRenderingContext2D, theme: BlockDropTheme, c: CellDraw): void
  drawLineClear(ctx: CanvasRenderingContext2D, theme: BlockDropTheme, d: LineClearDraw): void
}
```

The controller's `draw()` becomes:

1. Call `renderer.drawBackground`. Use the theme fill and grid, plus any theme
   backdrop such as the Tron horizon glow, Nature gradient, or Sketchbook
   major lines. The grid stays under the cells.
2. Draw locked cells from `lineClearEffect?.event.board ?? state.board`.
   **Skip rows listed in `lineClearEffect.event.rows`.**
3. When no line clear is active, draw the ghost and then the active piece, as
   today.
4. If a line clear is active, save the context, clip it to the board
   rectangle, call `renderer.drawLineClear`, and restore the context.
5. Fill the paused or game-over veil from `theme.board.*Veil`.

Rules for every renderer:

- **Deterministic.** Never call `Math.random()`. Use `hash(x, y, salt)` from
  `shared.ts`, copied from `preview.html`, for texture and particle
  variation.
- **Texture seed.** For locked cells, `seed = hash(x, y)`. For the active
  piece and ghost, use the cell index within the piece (0 to 3) combined with
  the piece type. Then Sketchbook hatching does not shift every time the
  piece moves. Classic ignores the seed.
- **No `shadowBlur`, no `filter`, and no off-screen canvases.** These are slow
  on mid-range phones when redrawn every frame. Draw glows as a wider
  translucent stroke under a sharp stroke.
- **No allocations inside the per-cell loop**, except unavoidable
  gradients. Nature and Stained Glass need gradients and are fine at 200
  cells.
- Snap sharp edges with `align()` (`Math.round(v * ratio) / ratio`) as the
  current code does.
- Line-clear effects may draw below their rows, such as drips, leaves, and
  shards. The clip from step 4 keeps them inside the board.

`LINE_CLEAR_MS` is removed. `startLineClear` stores
`durationMs: this.theme.clearMs` on the effect, and `advanceLineClear` reads
it from there.

### 3. CSS tokens set from TypeScript

All themed CSS values are custom properties named `--bd-*`. `BlockDrop.tsx`
writes `theme.tokens` as inline `style` custom properties on
`<main class="block-drop" data-theme={id}>`. The Help `<dialog>` is already
inside `<main>` and inherits them. `app.css` uses only `var(--bd-…)` in Block
Drop selectors, so CSS contains no per-theme color values. Unit tests can
then check contrast against the values in `themes.ts` directly.

Token names (`BlockDropToken`) are listed in `art-direction.md` §"Token
reference". Each token has one meaning; for example, `--bd-panel` is used by
the HUD and overlay card backgrounds.

**Page background and browser chrome.** `html` and `body` are outside
`<main>`. While Block Drop is mounted, an effect:

- sets `document.documentElement.dataset.blockDropTheme = id`
- sets `document.documentElement.style.setProperty('--bd-page', tokens.page)`
- updates `<meta name="theme-color">` to `metaThemeColor`

Its cleanup restores the previous values: remove the dataset key and
property, and put back the meta value read at mount time. In `global.css`,
add:

```css
html[data-block-drop-theme] { background: var(--bd-page); }
html[data-block-drop-theme] body { background: var(--bd-page); }
```

**Theme-specific decoration** that cannot be expressed as a token value goes
in `app.css` under `.block-drop[data-theme="…"]`. Examples are the Tron glow
box shadows, Sketchbook hand-drawn border radii, and the Stained Glass arched
pause card. Keep this decoration small: shapes and effects only, never
colors. Shadow colors are tokens too, such as `--bd-glow`. The board surface
has no decorative frame, shadow, or focus outline in any theme; focus styling
stays on interactive controls.

**Classic regression guard.** After tokenization, Classic must look the same
as before. Capture Playwright screenshots of Classic before starting
(playing, paused, Help open, and game over at 390x844 and 1280x800). Compare
them after the change with `maxDiffPixelRatio: 0.002`, then delete those
temporary snapshot tests or keep them if the project wants them.

### 4. Pause-menu picker

Put the picker at the bottom of the pause card, after the Resume, Restart, and
Help actions. Separate it from the actions with a divider so the theme choice
reads as its own section:

```html
<fieldset class="pause-theme">
  <legend><span>Theme</span><output>{label}</output></legend>
  <div class="theme-options">            <!-- one stacked column -->
    <label class="theme-option" data-theme-option="tron">
      <input type="radio" name="block-drop-theme" value="tron" class="visually-hidden" />
      <span class="theme-swatch" aria-hidden="true">  <!-- 2x2 mini cells -->
        <i/><i/><i/><i/>
      </span>
      <span class="theme-option-label">Tron</span>
    </label>
    …
  </div>
</fieldset>
```

- Use native radios to get arrow-key behavior and the radio-group role. Do
  not add custom key handling. Handle `onChange`: set state, write storage,
  and call `controllerRef.current?.setTheme?.(id)`.
- **The swatch shows the option's own theme**, not the active one. Set that
  theme's board, piece colors (I, O, T, Z), and cell decoration directly on
  the swatch. Use inline custom properties on the `<label>`, such as
  `--swatch-board` and `--swatch-1` through `--swatch-4`, and the existing
  preview-cell decoration rule keyed on `[data-theme-option="…"]`.
- The checked option gets a 2 px `--bd-accent` ring and bold label. Use
  `:has(input:focus-visible)` to show the focus ring on the label.
- Each tile is at least 44 px tall. Use one column at every width. Show the
  selected theme both in the legend and with a clearly distinct selected row.
  At 390x844, the whole pause card must fit without scrolling. It already
  scrolls internally if needed on short landscape screens.
- Because the change applies live, the HUD, header, controls, page
  background, and pause card restyle immediately. The playfield is behind the
  veil, but its colors also change. This is the preview.

### 5. Piece previews (Hold and Next)

Replace the inline `backgroundColor: TETROMINO_COLORS[type]` with
`style={{ '--piece': theme.pieces[type] }}`. Style
`.next-piece-cell.is-filled` from `var(--piece)`. Add a CSS decoration per
theme under `.block-drop[data-theme=…] .next-piece-cell.is-filled` that
matches the Canvas cell. The CSS recipe for each theme is in
`art-direction.md`. Previews are small, so use only the decoration's simple
form: bevel, outline, emboss, or rounding. Do not use hatching or textures.

### 6. Persistence

Match the existing difficulty pattern in `BlockDrop.tsx`:

```ts
const THEME_STORAGE_KEY = 'games.block-drop.theme'
function readTheme(): BlockDropThemeId   // try/catch → 'classic' on error/invalid
function writeTheme(id: BlockDropThemeId): void  // try/catch, ignore errors
```

Read the theme once when the component mounts, as difficulty is read today.
Pass it to `new BlockDropController(..., { theme })` so the first frame is
already themed. Restart keeps the theme because it is not part of the rules
state.

### 7. Line-clear duration per theme

| Theme | `clearMs` |
|---|---|
| Classic | 360 (twice the original 180 ms) |
| Tron | 640 |
| Chocolate | 840 |
| Nature | 800 |
| Sketchbook | 760 |
| Stained Glass | 720 |

Gameplay is frozen during the clear. These timings make each theme's clear
last twice as long as before, with a maximum of 840 ms. Do not scale gravity
or scoring to compensate. The line-clear callout lasts 1560 ms so it remains
visible through the longest clear.

The callout element gets the theme's font, color, and shadow from tokens.
Optional per-theme callout decoration is described in `art-direction.md`.

### 8. Reduced motion

The current behavior stays the same. When `reducedMotion()` is true,
`startLineClear` is never called, so no theme effect runs. The callout already
appears without movement.

### 9. Line milestone popup

The rules state already increments `level` at each 10-line boundary. When the
component observes a level increase, show a temporary notice whose only text
is the milestone count, such as “10 lines cleared!”. Keep it in the board frame
near the top so it reads as a game event without moving the playfield. Place it
separately from the centered line-clear callout. Style it with the active
theme's accent, card background and border, display font, and panel radius. The
notice is decorative (`aria-hidden`); add the same milestone text to the
existing game-announcement live region.

Keep the notice visible for 1800 ms. A later milestone replaces an earlier
notice and restarts its timer. Restart and unmount clear its timer and state.
With reduced motion, keep the notice visible for the same duration but remove
its entrance and exit animation. The popup does not pause input, change score,
or alter the line-clear effect.

## Risks / Trade-offs

- **Tokenization regressions in Classic.** Mitigate this with the
  before-and-after screenshot comparison in §3.
- **Canvas cost of richer cells** such as gradients, hatching, and particles.
  Mitigate this with the renderer rules in §2. Profile a full board during a
  four-row clear in Chrome DevTools with a 4x CPU slowdown. Frame time should
  stay under 16 ms. If it does not, simplify that theme's texture first, not
  its clear effect.
- **Sketchbook is a light theme.** Every other surface is dark, and some
  `app.css` rules may assume light text, such as disabled states or
  `button:active` inset shadows using `rgb(7 17 31 / 18%)`. Use tokens for
  these too: `--bd-press`, `--bd-disabled-text`, and `--bd-disabled-bg`. Check
  Sketchbook in every state.
- **Font fallbacks vary by OS.** Sketchbook and Stained Glass display stacks
  fall back to generic `cursive` or `serif`. Use display fonts only for
  headings, the score number, and the callout, never for body text or
  controls.
- **Different clear durations change pace slightly** between themes. This is
  accepted and capped, as described in §7.

## Migration Plan

1. Create Classic screenshots as the baseline.
2. Add `themes.ts` and `theme-renderers/` with Classic, moving the existing
   drawing code. Route the controller through the renderer. Tests should
   remain green and unchanged.
3. Tokenize `app.css` and apply tokens from TypeScript. Compare against the
   Classic screenshots.
4. Add persistence and the pause-menu picker.
5. Add the other five themes one at a time. For each one, add its palette and
   tokens, then cell and ghost drawing, preview decoration, the clear effect,
   and CSS decoration. Compare each with `preview.html`.
6. Add tests, run `npm run check`, and review on a phone.
