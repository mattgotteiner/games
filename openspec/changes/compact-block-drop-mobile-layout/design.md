## Context

`BlockDrop.tsx` renders a header (return button, kicker, large heading), a `game-stage` with the board frame and a HUD aside (score, next piece, status, scoring guide), and a `game-controls` block with four movement buttons, an action group (Drop, Pause, Restart), and a key-help line. `controller.ts` sizes the canvas from the board frame's bounds, capped by the remaining viewport height. Measured at 390 by 844, the canvas is 164 by 329 CSS pixels and the HUD card is roughly 510 device pixels tall. See `proposal.md` for motivation and `specs/block-drop/spec.md` for the requirement changes.

## Goals / Non-Goals

**Goals:**

- Give the playfield at least 540 CSS pixels of height at 390 by 844 with no page scrolling.
- Keep score, state, and next piece visible during play at every supported viewport.
- Keep the scoring explanation and keyboard help one tap away, with accessible structure.
- Separate session actions (pause, help, restart) from gameplay controls.
- Stop announcing every soft-drop point to screen readers.

**Non-Goals:**

- Changing rules, scoring values, the piece palette, or Canvas rendering (see `add-block-drop-ghost-piece`).
- Press-to-act or hold-to-repeat touch input and the thumb layout (see `add-block-drop-touch-repeat`).
- Pause and game-over overlays and moving restart into them (see `add-block-drop-pause-and-game-over-overlays`).

## Decisions

### Header row holds session actions

The game header becomes one row: return to catalog, the game name at a body-heading size, then pause/resume, help, and restart as compact icon-and-label buttons that keep 44 px targets. The "Falling-block puzzle" kicker is dropped on the game screen; the catalog card still shows it. Pause and restart leave the `action-controls` group, which keeps only hard drop next to the movement buttons.

Keeping restart in the control rows behind a confirmation dialog was rejected: a confirmation still costs a tap in the common case and still sits next to Drop. Restart moves again in `add-block-drop-pause-and-game-over-overlays`, into the pause and game-over surfaces. The new `Session action placement` requirement is written so that later move still satisfies it.

### Scoring guide in a native dialog

Render the existing `ScoringGuide` content, plus a keyboard-controls list, inside a `<dialog>` opened with `showModal()` from the header help button. The native dialog provides focus containment, Escape to close, and an inert background. If the game is playing when the dialog opens, dispatch `pause`. On close, leave the game paused and return focus to the help button.

Resuming automatically on close was rejected, because the player would lose time while their eyes move back to the board. A popover or inline expander was rejected, because it would either push the playfield or need custom focus handling.

### Portrait strip instead of a stacked HUD card

At the existing `max-width: 42rem` breakpoint, the HUD becomes a single row about 48 px tall: score (large tabular numerals) and state on the left, and the next-piece preview, shrunk to about 2.75rem, on the right. The scoring guide is no longer in the HUD, so nothing wraps to a second row. The wide and short-landscape layouts keep the HUD to the right of the board.

### Board frame fits the canvas

The visible frame (border, radial gradient, shadow) moves from the full-width `.board-frame` grid area onto an inner wrapper that is sized by the canvas. The outer element stays the measurement container that the controller's `ResizeObserver` watches, so the controller sizing logic does not change. On desktop, the freed width becomes plain background.

### One announcer for game events

Remove `aria-live` from the score. Add one visually hidden `role="status"` element. The component writes short messages to it when state transitions show a line clear ("Cleared 2 lines. Score 1,240."), pause, resume, or game over. Score stays readable through its label at any time. The status line keeps its visible text but loses `aria-live`, so events are not announced twice.

### Key help only for fine pointers

The key-help line is hidden under `(pointer: coarse)` and remains in the help dialog for every device.

## Risks / Trade-offs

- [Removing the always-visible guide hides the scoring rules from new players] -> The help button is labelled and always visible, and the dialog shows the same values from `BLOCK_DROP_SCORING`.
- [Icon-and-label header buttons may crowd 320 px wide screens] -> Hide the text captions below 22rem but keep accessible names, and check with a 320 by 568 browser case.
- [Existing component and e2e tests assert the always-visible scoring guide and the Drop/Pause/Restart group] -> Update those assertions in the same change; the gameplay assertions stay unchanged.
- [The announcer could miss quick successive events] -> Derive messages from state transitions in the existing state listener, and keep only the latest message.

## Migration Plan

1. Restructure the header and control groups and update component tests.
2. Move the scoring guide into the dialog with pause-on-open.
3. Rework portrait, wide, and short-landscape CSS and the board frame, then update browser geometry checks.
4. Add the announcer and remove the score's live region.
5. Run `npm run check`. Roll back by reverting the component and CSS; no data migration is needed.
