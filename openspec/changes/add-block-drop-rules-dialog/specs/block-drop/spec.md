## ADDED Requirements

### Requirement: Beginner rules guide
Block Drop SHALL provide a clearly labelled Rules button in the pause menu.
Activating it SHALL open a modal dialog titled `How to play` with a concise,
friendly explanation suitable for someone who has never played a falling-block
game. The guide SHALL explain that pieces made of four squares fall from the
top, that pieces can be moved and turned to fit together, that filling a
complete horizontal line clears it and lets the pieces above fall, and that the
game ends when there is no room for the next piece. It SHALL describe Drop as
an instant way to place a piece and Hold as an optional way to save a piece for
later. The guide SHALL state the goal of clearing lines and continuing play.
It SHALL use plain language and SHALL NOT duplicate the detailed scoring
breakdown. The dialog SHALL have a readable name and an explicit × close
button with an accessible name.

#### Scenario: Rules are available from pause
- **WHEN** the pause menu is shown
- **THEN** a labelled Rules button is available alongside the pause actions

#### Scenario: Player opens the beginner guide
- **WHEN** the player activates Rules
- **THEN** a modal dialog titled `How to play` presents the beginner guide while the game remains paused

#### Scenario: Player closes the beginner guide
- **WHEN** the player activates the dialog's × close button or presses Escape
- **THEN** the dialog closes, the pause menu remains open, the game remains paused, and focus returns to Rules

