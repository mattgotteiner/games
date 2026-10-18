## Context

The pause overlay currently contains the difficulty slider and Resume and
Restart actions. A separate scoring and controls dialog is available from the
game header. Beginners need a short explanation of the play goal and basic
actions without searching through the scoring details.

## Goals / Non-Goals

**Goals:**

- Make beginner rules available directly from the pause menu.
- Explain piece placement, line clearing, the top-out condition, and the
  optional Drop and Hold actions in plain language.
- Keep the game paused and return the player to the same pause menu when the
  guide closes.

**Non-Goals:**

- Changing scoring, difficulty, piece behavior, or gameplay controls.
- Replacing the existing scoring and keyboard-controls guide.
- Adding a tutorial that blocks or changes gameplay.

## Decisions

- Label the pause-menu button `Rules` and title the dialog `How to play`.
- Use a modal dialog separate from the scoring guide. Keep the paused game and
  pause menu in place underneath it.
- Use concise, friendly copy with no unexplained game jargon. Proposed text:

  > Each piece has four squares and starts at the top of the board. Use the
  > controls to move it left or right and turn it to fit with the pieces below.
  > Once a piece is in place, a full line across the board clears and the pieces
  > above slide down. Keep your pile low so the next piece has room. If it
  > cannot fit, the game is over. Drop sends your piece straight down, and Hold
  > saves a piece for later. Clear lines and keep playing as long as you can.

- The dialog has an explicit × close button with an accessible name and can
  also close with Escape. Closing it leaves the game paused and restores focus
  to the Rules button.

## Risks / Trade-offs

- The Rules guide and existing scoring guide serve different needs. Keep the
  new copy focused on play goals and basic actions so it does not become a
  second scoring or keyboard reference.
- A modal dialog opened over the pause overlay must not allow gameplay input to
  resume or change the paused board.

## Migration Plan

1. Add the Rules action and modal content to the pause menu.
2. Preserve paused state, Escape/× dismissal, and focus restoration.
3. Verify the dialog and close behavior in browser E2E review.
