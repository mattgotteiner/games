## Why

Block Drop never gets harder. Gravity is fixed at 700 ms for the whole game and there's no lines counter, so a long game feels the same as a short one. With the best score from `add-block-drop-pause-and-game-over-overlays`, levels give the player both a reason to keep going and a sense of progress. `HANDOFF.md` lists levels as deferred work. This change brings them forward because they make the biggest difference to how the game feels over a long run.

## What Changes

- Track lines cleared and a level: level = floor(lines / 10) + 1, starting at 1.
- Shorten the gravity interval as the level rises: `max(80, round(700 × 0.85^(level − 1)))` ms. Level 1 keeps today's 700 ms, and level 10 is about 162 ms.
- Multiply line-clear points by the level at the time of the clear. Soft-drop and hard-drop points stay the same.
- Add an accessible three-position difficulty slider to the pause menu: Easy (half speed), Medium (default, 1×), and Hard (1.5× speed). Difficulty changes gravity only; level progression and the level-based score multiplier stay the same.
- Show level and lines in the HUD, flash the level once when it changes, and announce level-ups.
- Show a short callout over the playfield on each line clear with the points earned, such as "+300 · Double".
- Update the scoring guide to explain the level multiplier.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Line-clear scoring scales with level, the scoring guide explains it, and requirements define level progression, difficulty selection, and the line-clear callout.

## Impact

- `rules.ts` gains `lines` and `level` state fields, a difficulty-aware `getGravityInterval(level, difficulty)` helper, and level-scaled line-clear scoring. `controller.ts` reads the level and difficulty when advancing gravity. `BlockDrop.tsx` and `app.css` add the HUD fields, pause-menu slider, callout, and announcements.
- Seeded replay stays deterministic, because level and lines are derived only from rule transitions.
- No new dependencies, APIs, or persisted data. The best-score key is unchanged, but scores will now run higher.
- Fifth of the original six planned Block Drop changes. It assumes `compact-block-drop-mobile-layout` (scoring dialog, announcer, HUD strip). Follow-up score scaling by difficulty is tracked separately.
