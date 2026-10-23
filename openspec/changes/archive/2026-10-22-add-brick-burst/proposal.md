## Why

The catalog has one game. Block Drop is complete: rules, controls, themes,
persistence, and offline play are all done. The catalog promises "a growing
collection", so the next step is a second game.

A brick breaker is a good second game. It is a different kind of play
(real-time aiming and reflexes instead of planning), but it fits the same
phone-first shell. It needs one input, steering the paddle, which works well
with a thumb drag. Its art can come from the same procedural Canvas
approach, so it needs no images or fonts and still works offline.

It is also the "another game" that `HANDOFF.md` has been waiting for before
it adds shared platform code. Building it shows which Block Drop pieces are
duplicated in practice, and this change extracts only those.

## What Changes

- Add **Brick Burst**, a single-player brick breaker, as the catalog's second
  game. The name is original, just as Block Drop is.
- Gameplay:
  - a fixed 384 × 576-unit playfield with a 12 × 8 brick grid
  - one paddle and one ball
  - three lives
  - five hand-made level layouts that repeat at a higher speed after level 5
  - normal bricks and two-hit **tough** bricks
- The ball's bounce angle depends on where it hits the paddle. The rules
  never allow a ball path flatter than 30° from horizontal, so the ball cannot
  get stuck bouncing sideways.
- Rules are deterministic and pure (`rules.ts`), like Block Drop. A seed sets
  the serve angles. The same seed and inputs always give the same game.
- Scoring uses the brick's row band (10 to 40 points), adds a level-clear
  bonus, and multiplies by difficulty. Difficulty (Easy, Medium, Hard) sets
  ball speed and the score multiplier. It is chosen in the pause menu and
  saved on the device.
- Controls:
  - **touch:** a relative thumb drag anywhere on the playfield or control bar
    steers the paddle; a tap serves the ball
  - **mouse:** the paddle follows the pointer over the playfield; a click
    serves
  - **keyboard:** ← and → or A and D steer, Space or ↑ serves, P pauses,
    and R restarts
  - **visible buttons:** Left, Serve, and Right, so every action has a
    visible, labelled control
- Chrome matches Block Drop: a compact header with Pause, a HUD (score,
  level, lives), a pause card with Difficulty, Restart, and Help, a game-over
  card with the best score, a polite live region, and optional haptics.
- Art direction: **Classic**, from the same family as Block Drop Classic. It
  uses the midnight board and bevelled candy bricks, plus a cyan paddle and a
  white ball with a short trail. Signature effects:
  - bricks pop into fragments
  - tough bricks crack
  - a light sweep marks a level clear
- The catalog lists two games. `?game=brick-burst` deep-links to the new
  game.
- Extract three small helpers that both games now need into
  `src/games/shared/`: validated device storage, haptics, and the document
  page-color effect. Block Drop switches to them with no change in behavior.
  A general game registry or runtime is still deferred.

## Capabilities

### New Capabilities

- `brick-burst`: rules, controls, presentation, persistence, accessibility,
  and offline play for Brick Burst.

### Modified Capabilities

- `game-deep-links`: the stable URL and direct-entry requirements also cover
  `game=brick-burst`.

## Impact

- New modules in `src/games/brick-burst/`:
  - `rules.ts`
  - `levels.ts`
  - `controller.ts`
  - `renderer.ts`
  - `palette.ts`
  - `BrickBurst.tsx`
  - `brick-burst.css`
  - tests
- New `src/games/shared/`: `storage.ts`, `haptics.ts`, and
  `use-page-color.ts`. `BlockDrop.tsx` imports them in place of its private
  copies.
- `game-navigation.ts` adds `'brick-burst'` to `GameId`. `App.tsx` gains a
  second catalog card, the count changes to "2 games", and the view switch
  adds a Brick Burst branch.
- New `localStorage` keys: `games.brick-burst.best-score` and
  `games.brick-burst.difficulty`.
- No new dependencies, images, or web fonts. Brick Burst is part of the
  built bundle, so the existing precache covers offline play.
- Brick Burst ships with one look, Classic. Its chrome reuses Block Drop
  Classic's token values. Themes for Brick Burst are a planned follow-up. The
  renderer and token setup are designed so that follow-up only adds data and
  renderers (see `design.md` §8).
