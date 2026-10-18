## Context

The pause overlay currently contains the difficulty slider and Resume and
Restart actions. A separate Help control in the game header opens a scoring
and keyboard-controls dialog. Adding a separate Rules control would split
related information across two entry points.

## Goals / Non-Goals

**Goals:**

- Provide one Help entry point in the pause menu for both new and experienced
  players.
- Put a short beginner explanation before the detailed scoring and keyboard
  reference.
- Explain piece placement, line clearing, the top-out condition, and the
  optional Drop and Hold actions in plain language.
- Keep the game paused and return the player to the same pause menu when Help
  closes.

**Non-Goals:**

- Changing scoring, difficulty, piece behavior, or gameplay controls.
- Changing the existing scoring or keyboard-controls content.
- Adding a tutorial that blocks or changes gameplay.

## Decisions

- Remove the header Help control and put a single `Help` button in the pause
  menu.
- Use one modal dialog titled `Help`, with `How to play` first and the existing
  `Scoring and controls` section after it. Keep the paused game and pause menu
  in place underneath.
- Use concise, friendly copy with no unexplained game jargon. Proposed text:

  > Each piece has four squares and starts at the top of the board. Use the
  > controls to move it left or right and turn it to fit with the pieces below.
  > Once a piece is in place, a full line across the board clears and the pieces
  > above slide down. Keep your pile low. The game ends if there is no room for
  > a new piece, or if any part of a piece is still above the board when it
  > lands. Drop sends your piece straight down, and Hold saves a piece for
  > later. Clear lines and keep playing as long as you can.

- Preserve the existing scoring details and keyboard mappings after the new
  introductory section.
- The dialog has an explicit × close button with an accessible name and can
  also close with Escape. Closing it leaves the game paused and restores focus
  to the Help button.
- At constrained viewports, keep the close control reachable and allow the
  dialog content to scroll internally rather than scrolling the game page.

## Risks / Trade-offs

- The combined dialog is longer than the current guide. Put the short
  introduction first and keep the detailed reference clearly separated under
  its own heading.
- A modal dialog opened over the pause overlay must not allow gameplay input to
  resume or change the paused board.

## Migration Plan

1. Move the single Help action into the pause menu and remove it from the
   header.
2. Combine the beginner rules, scoring details, and keyboard reference in one
   modal dialog.
3. Preserve paused state, Escape/× dismissal, and focus restoration.
4. Verify the consolidated dialog and close behavior in browser E2E review.
