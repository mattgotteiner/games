Read `design.md` and `art-direction.md` first. Open `art-direction/preview.html`
in a browser and keep it open as the visual reference. Finish each section
and keep `npm run check` green before starting the next one.

## 1. Shared helpers (Block Drop behavior unchanged)

- [ ] 1.1 Create `src/games/shared/storage.ts` with `readStored` and `writeStored` (design §7). Rewrite Block Drop's `readBestScore`, `readDifficulty`, and `readTheme` and their writers on top of it. Keep the keys and fallbacks unchanged.
- [ ] 1.2 Create `src/games/shared/haptics.ts` with the support and reduced-motion guard from `vibrateForGameEvent`. Block Drop keeps its own durations.
- [ ] 1.3 Create `src/games/shared/use-page-color.ts` from Block Drop's document effect. Parameterize the `html` attribute name. Block Drop keeps using `data-block-drop-theme`.
- [ ] 1.4 Add unit tests for the three helpers. Run the full suite. All existing Block Drop tests must pass without edits.

## 2. Rules and levels (no UI)

- [ ] 2.1 Create `levels.ts` with the five layouts from design §3, the row colors' point bands, and `layoutForLevel(n)`. Test the size, the allowed symbols, left-right symmetry, the brick and tough counts (72/0, 42/2, 56/12, 54/30, 50/2), and that layouts repeat after level 5.
- [ ] 2.2 Create `rules.ts` with the constants, types, `createGame`, `applyAction`, `step`, and `levelSpeed` from design §2. Use the seeded `mulberry32` generator only for serve angles.
- [ ] 2.3 Add rules tests:
  - a new game starts serving at level 1 with score 0 and 3 lives
  - the ball follows the paddle while serving, and serve uses `serveAngle`
  - serve angles stay within 8° to 30° on both sides across 1,000 seeds
  - walls reflect, and the ball cannot stick to a wall
  - a paddle hit at the center goes straight up, a hit at the edge leaves at 60°, and the angle is proportional in between
  - a ball whose center is already below the paddle top is not saved by `paddle-to`
  - brick tie-break order, smallest-overlap reflection, and at most one brick per step
  - a tough brick takes two hits, `damaged` is set after the first, and the scores are correct
  - every point band at every difficulty, the level bonus, and rounding (use the spec scenarios as cases)
  - the speed ramps every 8 hits, is capped at 1.6×, and resets after a lost ball
  - a difficulty change applies at the next serve only
  - `ball-lost` and `level-clear` freeze the game for 600 and 900 ms of steps, then move to serving or the next level
  - the game ends after the last life
  - pause from every pausable status, then resume restores it; `step` does nothing while paused
  - **no tunneling:** at maximum Hard speed (840 u/s), fire at a single-brick layout from 0° to 60° in 1° steps; it always hits
  - **no flat paths:** a property test over 200 seeds × 20,000 steps of random steering; `|vy| ≥ speed·sin 30°` whenever playing
  - **determinism:** the same seed and timed actions give deep-equal states

## 3. Palette, renderer, and controller

- [ ] 3.1 Create `palette.ts` with `BrickBurstLook`, `BRICK_BURST_LOOKS.classic` (art-direction "Palette"), and `tokens: BLOCK_DROP_THEMES.classic.tokens`.
- [ ] 3.2 Create `renderer.ts` with `classicRenderer`, porting each recipe from `preview.html`. Import `hash` from `block-drop/theme-renderers/shared.ts`.
- [ ] 3.3 Create `controller.ts` (design §4):
  - fixed-step accumulator with the 100 ms cap
  - action queue
  - resize to 2:3 at the device pixel ratio
  - draw order
  - effects list with a pausable clock, and the trail buffer
  - keyboard and pointer mapping, including the tap-to-serve rule and steer combining
  - `destroy()`
- [ ] 3.4 Compare each game state side by side with `preview.html`: serving, rally, pops, ball lost, level sweep, and paused.

## 4. Component and chrome

- [ ] 4.1 Create `BrickBurst.tsx`:
  - header with Pause
  - HUD: score, level, lives pips with text, difficulty, and status
  - board frame with the serve hint and the level callout
  - control bar
  - pause card: Difficulty, Resume, Restart, and Help
  - game-over card: final score, best score, new best, and Play again
  - Help dialog
  - one polite live region
  - visibility-based pause
  - haptics
  - persistence for the best score and difficulty
- [ ] 4.2 Apply the Classic tokens as `--bd-*` custom properties on `<main class="brick-burst" data-theme="classic">`. Use `usePageColor` with `data-brick-burst-theme`, and add the `global.css` rule pair.
- [ ] 4.3 In `app.css`, broaden the root `.block-drop`, `.block-drop :focus-visible`, and `.block-drop button *` rules to `:is(.block-drop, .brick-burst)`. Change nothing else in `app.css`.
- [ ] 4.4 Create `brick-burst.css` with the control bar, 2:3 board frame, `touch-action: none` areas, lives pips, serve hint, and HUD strip. Use only `var(--bd-*)` values.
- [ ] 4.5 Check that at 390×844 the HUD strip, a playfield at least 520 px tall, and the control bar fit without page scrolling. Also check a short landscape phone and a 1280×800 wide layout.

## 5. Navigation and catalog

- [ ] 5.1 Add `'brick-burst'` to `GameId`, and accept it in `parseGameUrl` through a supported-games set.
- [ ] 5.2 In `App.tsx`, add the Brick Burst view branch, the `brickBurstControllerFactory` prop, the second catalog card (design §9), the `2 games` count, and `game-shell` for both games.
- [ ] 5.3 Update the navigation and catalog tests that assert one game.

## 6. Verification

- [ ] 6.1 Component tests:
  - the catalog shows both cards in order
  - Serve is disabled unless the game is serving
  - Left and Right press and release send steer; keyboard activation nudges
  - Pause opens the card with Resume focused
  - a difficulty change is saved and shown in the HUD
  - the game-over card shows the best score and new best, and focuses Play again
  - lives are exposed as text
  - only the specified events are announced
  - unmount restores the `html` attribute, page color, and meta `theme-color`
- [ ] 6.2 Controller tests with fake frames:
  - 60 Hz and 120 Hz frames give the same state
  - a long frame is capped at 100 ms
  - resume drops paused time
  - a touch drag maps 1:1 to logical units at two board sizes
  - a tap serves and a drag does not
  - with reduced motion, no pops, trail, sweep, or fade-in are queued or drawn
  - `destroy()` leaves no frame, listener, or observer
- [ ] 6.3 Renderer tests with the recording mock 2D context: drawing the same input twice gives the same call sequence, `Math.random` is never called, and every effect draws at progress 0, 0.5, and 1 without throwing.
- [ ] 6.4 E2E flows (Chromium and the mobile project):
  - launch from the catalog; the URL contains `game=brick-burst`
  - serve with a tap; steer with a drag; the page does not scroll
  - pause and resume
  - lose all lives using a seeded `initialState` hook; Play again
  - deep link `?game=brick-burst`
  - Back to the catalog restores the page colors
  - offline launch after a controlled online load
- [ ] 6.5 Profile a full-board rally with pops on a 4× CPU slowdown. Each frame must take under 16 ms.
- [ ] 6.6 Save phone-size screenshots of serving, a rally, mid-pop, ball lost, level clear, paused, and game over to `test-results/brick-burst/` for review. Do not commit them.
- [ ] 6.7 Run `npm run check`.
- [ ] 6.8 Do a phone review using the checklist at the end of `art-direction.md`, with particular attention to the steering feel (design "Risks").
