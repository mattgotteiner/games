## MODIFIED Requirements

### Requirement: Visible scoring explanation
Block Drop SHALL provide a single, labelled Help button in the pause menu and
SHALL NOT provide a separate Help control in the game header. Activating Help
SHALL open a modal dialog titled `Help` that begins with a concise, friendly
`How to play` section for players new to falling-block games, followed by the
existing `Scoring and controls` reference. The beginner section SHALL explain
that four-square pieces start at the top, can be moved and turned to fit
together, and clear a complete horizontal line once placed, causing the pieces
above to move down. It SHALL explain that the game ends when there is no room
for the next piece or any part of a piece remains above the board when it
lands. It SHALL describe Drop as an instant way to place a piece and Hold as
an optional way to save one for later, and state the goal of clearing lines
and continuing play. It SHALL use plain language and SHALL NOT include the
detailed scoring breakdown in this first section.

The `Scoring and controls` section SHALL state the base values for soft drops
and hard drops, that automatic gravity earns no points, and that line clears
use the level before the clear. It SHALL explain the Easy 0.5×, Medium 1×, and
Hard 1.5× difficulty score multipliers, the combined line-clear formula, and
that the level rises every ten lines and increases the falling speed. It SHALL
also list the keyboard controls. The displayed values SHALL remain consistent
with the deterministic score calculation. The modal SHALL have a readable
name, an explicit × close button with an accessible name, and SHALL close on
Escape. Closing it SHALL leave the game paused, return to the pause menu, and
restore focus to Help. At portrait or short-landscape phone viewports, all
content SHALL remain reachable within the dialog without forcing the game page
to scroll.

#### Scenario: Help is consolidated in the pause menu
- **WHEN** the user opens the pause menu
- **THEN** one labelled Help button is available there and no separate Help control is shown in the game header

#### Scenario: Beginner guide appears before detailed help
- **WHEN** the user activates Help from the pause menu
- **THEN** the modal titled `Help` shows `How to play` before `Scoring and controls`, while the game remains paused

#### Scenario: Scoring details remain available
- **WHEN** the user reads the `Scoring and controls` section
- **THEN** it identifies every score-changing action, the points awarded, the level multiplier, difficulty multipliers, and keyboard controls

#### Scenario: Player presses soft drop
- **WHEN** a successful soft drop increases the score and the user opens Help
- **THEN** the scoring section explains the base soft-drop points and the selected difficulty multiplier

#### Scenario: Automatic gravity advances
- **WHEN** gravity moves a piece without changing the score and the user opens Help
- **THEN** the scoring section explains that automatic gravity earns no points

#### Scenario: Player closes Help
- **WHEN** the player activates the dialog's × close button or presses Escape
- **THEN** the dialog closes, the pause menu remains open, the game remains paused, and focus returns to Help

#### Scenario: Help is readable in a constrained viewport
- **WHEN** the Help dialog is open on a portrait or short-landscape phone viewport
- **THEN** its content remains reachable by scrolling inside the dialog, the close control remains available, and the game page does not scroll

#### Scenario: Help is inspected semantically
- **WHEN** a user or assistive technology inspects the Help dialog
- **THEN** it has a readable name and associates each scoring action with its point value

