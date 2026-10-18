## Context

The rules already keep the current piece, queued next piece, bag, and random
state together. The controller dispatches logical actions from touch controls
and keyboard input, while the HUD currently shows the next piece.

## Goals / Non-Goals

**Goals:**

- Let the player store one piece and later swap it with the active piece.
- Keep hold deterministic and limited to once per active piece.
- Make the slot and action readable and usable on a phone and with a keyboard.

**Non-Goals:**

- Multiple hold slots, hold-piece persistence across restarts, or scoring for
  hold actions.
- Changing the existing seven-piece bag, next preview, or spawn orientation.

## Decisions

- Store `heldPiece` and `holdUsed` in the deterministic game state.
- An empty hold consumes the queued next piece as the new active piece and
  draws a replacement next piece from the existing bag.
- A populated hold swaps piece types; the incoming held piece spawns centered
  in its initial orientation. The queue and random state do not change.
- The hold eligibility resets when a piece locks and the next piece spawns.
- Expose the action as a visible `Hold piece` control and the `C` key. Disable
  the control after use until the active piece locks.
- Show an empty or occupied hold preview beside the existing next preview.
- Keep hold available at every difficulty. Difficulty changes fall speed and
  scoring; the one-use-per-piece limit keeps hold bounded without removing a
  core action from Hard mode.
- On portrait phones, center Hold horizontally between the movement and
  rotate/drop controls with at least 16 px of clearance on each side. Center
  Hold vertically between Rotate and Hard drop.

## Risks / Trade-offs

- A held piece can fail to spawn if its initial cells collide with the board;
  this ends the game using the existing spawn-collision behavior.
- The extra preview and control consume phone screen space; keep both compact
  and preserve the current board-first layout and 56-pixel touch targets.

## Migration Plan

1. Add deterministic hold state and action rules.
2. Add keyboard, touch control, preview, and accessible status.
3. Cover hold, swap, reuse limits, queue preservation, restart, and phone flow.
4. Run the integrated checks and review the phone layout before archival.
