## Context

`BlockDropState` holds the board, active and next piece, bag, random state, seed, status, and score. `lockActive` adds `BLOCK_DROP_SCORING.lineClears[count]` to the score. `controller.ts` uses the constants `GRAVITY_MS = 700` and `MAX_FRAME_MS = GRAVITY_MS * 2`. After `compact-block-drop-mobile-layout`, the HUD is a compact strip on portrait phones and a side column elsewhere, and a status announcer reports game events. See `proposal.md` and `specs/block-drop/spec.md`.

## Goals / Non-Goals

**Goals:**

- Make the game get harder in a predictable, deterministic way, starting at today's pace.
- Make progress visible: level, lines, and the points from each clear.
- Keep the scoring guide accurate.

**Non-Goals:**

- Choosing a starting level, which can come later.
- T-spin, combo, or back-to-back bonuses, which need SRS (see `add-block-drop-wall-kicks` for the basic kicks).
- Lock delay. Pieces still lock on the first failed gravity step.

## Decisions

### Level and lines live in rules state

Add `lines: number` and `level: number` to `BlockDropState`. `createGame` sets them to 0 and 1. `lockActive` adds the cleared count to `lines`, and then sets `level = Math.floor(lines / 10) + 1`. Restart resets both. Keeping them in the rules means seeded replays and existing determinism tests cover them.

Deriving the level in the controller was rejected because scoring needs it in the rules.

### Gravity curve

`getGravityInterval(level) = Math.max(80, Math.round(700 * 0.85 ** (level - 1)))`, exported from `rules.ts`, gives:

| Level | 1 | 2 | 3 | 5 | 10 | 14 | ≥15 |
|---|---|---|---|---|---|---|---|
| ms | 700 | 595 | 506 | 365 | 162 | 85 | 80 |

The controller replaces `GRAVITY_MS` with `getGravityInterval(state.level)` and computes `MAX_FRAME_MS` per tick as twice that interval, so the existing bounded catch-up logic keeps working.

A lookup table modelled on a specific commercial game was rejected. The formula is original, easy to test, and starts at the current pace.

### Scoring scales with the level before the clear

Line-clear points are `lineClears[count] × level`, using the level before the clear is counted. This is the usual convention, and it means reaching a new level never pays out for the clear that reached it. `BLOCK_DROP_SCORING` keeps its base values, and the scoring guide states the multiplier.

### Feedback

- The HUD gains "Level" and "Lines" values in tabular numerals. In the portrait strip they share one line under the score ("L3 · 27 lines").
- When the level changes, the level value gets a one-shot highlight (a CSS animation of under 400 ms), which reduced motion turns off.
- A line-clear callout ("+300 · Double", "+800 · Quad") appears centred over the playfield for the 180 ms clear effect plus about 600 ms. It is `aria-hidden`, because the announcer reports the same information. Under reduced motion it appears and disappears without movement.
- The announcer adds "Level 3." to the line-clear message when a level is reached.

## Risks / Trade-offs

- [Adding state fields breaks fixtures that build states by hand] -> Give fixtures defaults through `createGame` spreads, as the tests already do, and add the fields where literals are used.
- [Higher scores make old best scores easy to beat] -> This is acceptable. The best score is per device and informal.
- [80 ms gravity at high levels may be too hard on touch] -> The floor is 80 ms, not the 1–2 frame speeds of some games. The curve can be tuned in one function.

## Migration Plan

1. Add the state fields, gravity helper, and scaled scoring with rules tests.
2. Switch the controller to the level-based interval, with controller tests.
3. Add the HUD fields, highlight, callout, announcements, and scoring-guide text, with component tests.
4. Extend browser checks and run `npm run check`. Roll back by reverting. No persisted data changes shape.
