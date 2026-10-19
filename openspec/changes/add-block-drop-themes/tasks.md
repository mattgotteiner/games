Read `design.md` and `art-direction.md` first. Open `art-direction/preview.html`
in a browser and keep it open as the visual reference. Finish each section
and keep `npm run check` green before starting the next one.

## 1. Baseline and theme data

- [x] 1.1 Capture Classic baseline screenshots with Playwright: playing, paused, Help open, and game over, each at 390×844 and 1280×800. Keep them uncommitted, or in a temporary spec, until 2.4.
- [x] 1.2 Create `src/games/block-drop/themes.ts` with `BlockDropThemeId`, `BLOCK_DROP_THEME_ORDER`, `BlockDropTheme`, `BlockDropToken`, `BLOCK_DROP_THEMES`, and `isBlockDropThemeId`. Copy all values exactly from the `art-direction.md` tables.
- [x] 1.3 Make `TETROMINO_COLORS` an alias of the Classic pieces, or remove it after its last use.

## 2. Renderer seam (Classic only, no visual change)

- [x] 2.1 Create `theme-renderers/shared.ts`, porting `hash`, `mix`, `alpha`, `ease`, `clamp01`, and `roundRect` from `preview.html`. Add `align`.
- [x] 2.2 Move the current background, grid, cell, ghost, and flash drawing into `theme-renderers/classic.ts` behind the `ThemeRenderer` interface. Add `theme-renderers/index.ts`.
- [x] 2.3 Update `BlockDropController`:
  - add the `theme` option, defaulting to Classic, and `setTheme(id)`, which redraws
  - follow the draw order in design §2: skip cleared rows, clip the clear to the board, and use theme veils
  - store `durationMs` on the line-clear effect and remove `LINE_CLEAR_MS`
- [x] 2.4 Check that existing tests still pass and that the Classic screenshots match the baseline.

## 3. Tokens and chrome

- [x] 3.1 In `app.css`, replace each Block Drop literal color, radius, and font with `var(--bd-<token>, <original literal>)`. This covers the HUD, header, board surface, overlays, cards, buttons and their hover, active, and disabled states, controls, previews, callout, Help dialog, slider, and level highlight. Leave catalog-only selectors unchanged.
- [x] 3.2 In `BlockDrop.tsx`, apply `theme.tokens` as inline `--bd-*` properties and `data-theme` on `<main class="block-drop">`.
- [x] 3.3 Add the document effect: set `html[data-block-drop-theme]` and `--bd-page`, swap the meta `theme-color`, and restore all of them on unmount. Add the two `global.css` rules.
- [x] 3.4 Change Hold and Next preview cells to use `--piece` instead of an inline `backgroundColor`.
- [x] 3.5 Compare Classic with the baseline again. It must be identical.
- [x] 3.6 Set all six themes' panel, control, score, cell, preview, swatch, and popup corners to square, including gameplay control buttons.
- [x] 3.7 Improve the visibility of the Hold and Next piece previews across all themes, especially at phone size.

## 4. Picker and persistence

- [x] 4.1 Add `readTheme` and `writeTheme` using the key `games.block-drop.theme`. Validate with `isBlockDropThemeId`, catch storage errors, and fall back to Classic. Read the theme when the component mounts and pass it to the controller.
- [x] 4.2 Add the `pause-theme` fieldset below the pause actions as a single stacked list, with a clearly marked selected row: native radios, swatch tiles, and live apply, save, and `setTheme` (design §4, art-direction "Theme picker swatch").
- [x] 4.3 Check that the pause card fits without scrolling at 390×844 and still scrolls internally on short landscape viewports.

## 5. Themes (one at a time, compared with `preview.html`)

For each theme, implement:

- the renderer: background, cell, ghost, and clear
- preview-cell CSS
- `.block-drop[data-theme=…]` decoration
- the callout style
- no decorative frame, outline, or shadow around `.board-surface`

- [x] 5.1 Tron
- [x] 5.2 Chocolate
- [x] 5.3 Nature
- [x] 5.4 Sketchbook. Also check the press, disabled, and focus states on the light surfaces.
- [x] 5.5 Stained Glass
- [x] 5.6 Profile a four-row clear with a full board in each theme, using a 4× CPU slowdown. Each frame must take under 16 ms. If a theme is too slow, simplify its texture before its clear effect.

## 6. Verification

- [x] 6.1 Unit tests for `themes.ts`:
  - every theme has 7 distinct `#rrggbb` piece colors
  - every `clearMs` is between 360 and 900 after doubling the original durations
  - contrast is at least 4.5 for `text`, `text-muted`, and `label` on `panel`; `primary-text` on `primary-bg`; `secondary-text` on `secondary-bg`; and `control-text` on `control-bg`
  - contrast is at least 3 for `focus` on `page` and `control-border` on `page`
  - Classic values equal the pre-change literals, except for the square-corner values and the contrast correction documented in `art-direction.md`
- [x] 6.2 Renderer tests using a recording mock 2D context:
  - each renderer draws the same call sequence twice for the same input, so drawing is deterministic
  - no renderer calls `Math.random`
  - line-clear drawing at `progress` 0, 0.5, and 1 does not throw
  - the controller skips cleared rows and clips the clear to the board rectangle
- [x] 6.3 Component tests:
  - the Theme radio group lists the six themes in order with the saved one checked
  - selecting a theme updates `data-theme`, calls `setTheme`, and writes storage without changing game state or paused status
  - invalid or unavailable storage falls back to Classic
  - restart keeps the theme
  - unmount restores the `html` attributes and meta `theme-color`
- [x] 6.4 Controller tests: a line clear lasts the active theme's `clearMs`; `setTheme` while paused redraws without changing state; reduced motion skips the effect in every theme.
- [x] 6.5 Browser flow: pause, choose Chocolate, confirm `data-theme` and the meta `theme-color`, reload, and confirm Chocolate is restored and checked. Browser Back to the catalog restores the catalog background.
- [x] 6.6 Save a phone-size screenshot of each theme while playing, paused, and mid-clear to `test-results/` for review. Do not commit the screenshots.
- [x] 6.7 Run `npm run check`.
- [ ] 6.8 Do a phone review of all six themes using the checklist at the end of `art-direction.md`.
- [x] 6.9 Component and phone E2E coverage for themed line milestones at 10 and 20 lines, accessible announcement, reduced motion, and dismissal on restart.
