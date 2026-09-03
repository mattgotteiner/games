## Context

See `proposal.md` for motivation. Scoring is currently spread across a private
line-clear table and literals for manual drops, while the HUD renders only the
current total. The HUD is a right-side panel on wide and short-landscape
viewports and a compact top panel in portrait, so new explanatory content must
fit all three layouts.

## Goals / Non-Goals

**Goals:**

- Keep calculation and displayed values sourced from the same immutable scoring
  metadata.
- Make every scoring source understandable without interaction.
- Preserve the existing no-scroll responsive game layouts and semantic HUD.

**Non-Goals:**

- Changing point values, adding levels, combos, back-to-back awards, or
  high-score persistence.
- Adding score animations or per-action score notifications.

## Decisions

### Expose one scoring definition from the rules module

Define immutable scoring metadata for soft-drop distance, hard-drop distance,
gravity, and simultaneous line clears. Existing calculations and the HUD will
consume that metadata so copy cannot silently drift from behavior.

Keeping separate UI literals was rejected because a future scoring adjustment
could update the engine without updating its explanation.

### Render a compact semantic definition list in the HUD

Add a labeled scoring section to the existing Game information region using a
heading and definition list. Use concise visible rows:

- Soft drop - `+1 / row`
- Hard drop - `+2 / row`
- Gravity - `+0`
- Lines - `1: +100`, `2: +300`, `3: +500`, `4: +800`

An interactive help dialog or collapsed disclosure was rejected because the
unexpected soft-drop increase should be explained immediately, not only after a
player discovers and opens help.

### Compress presentation rather than hide rules on constrained screens

Wide layouts may render line-clear values as separate rows or a compact table.
Portrait and short-landscape layouts will reduce type, spacing, and arrange the
same content compactly while keeping every value visible. The existing HUD and
game layout boundaries remain authoritative; the guide must not introduce page
scrolling at 390 by 844 or 568 by 320.

## Risks / Trade-offs

- [Additional HUD content competes with the board on short screens] -> Use compact
  typography and grouped line-clear values, then assert target viewports remain
  scroll-free.
- [Technical scoring terms remain unfamiliar] -> Use the same "Soft drop," "Hard
  drop," and "Gravity" terminology already exposed by gameplay controls and
  behavior.
- [UI values drift from calculations] -> Render values from the shared immutable
  scoring definition and cover both calculations and displayed copy in tests.
