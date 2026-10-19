## ADDED Requirements

### Requirement: Visual themes
Block Drop SHALL offer six cosmetic themes: Classic, Tron, Chocolate, Nature, Sketchbook, and Stained Glass. Classic SHALL be the default and SHALL match the presentation before this change. A theme SHALL restyle the playfield, piece previews, line-clear feedback and callout, HUD, header, overlays, controls, Help dialog, page background, and browser theme color. The board surface SHALL have no decorative frame, outline, or shadow in any theme. Focus indicators SHALL remain on interactive controls and theme options. A theme SHALL NOT change the rules, scoring, gravity, input, controls, accessible names, or announcements.

All static theme surfaces and pieces SHALL use square corners, including board
cells, piece previews, theme swatches, panels, cards, dialogs, milestone popups,
buttons, and gameplay controls. Transient line-clear effects MAY use curved
shapes when needed to depict their theme's effect.

#### Scenario: First launch
- **WHEN** Block Drop opens and no valid theme preference is saved
- **THEN** the Classic theme is shown and looks the same as before themes existed

#### Scenario: Theme is applied
- **WHEN** a theme is active
- **THEN** the playfield, piece previews, HUD, overlays, controls, Help dialog, page background, and browser theme color all use that theme's art direction

#### Scenario: Theme corners stay square
- **WHEN** any theme is active
- **THEN** static themed cells, previews, surfaces, dialogs, and controls have square corners

#### Scenario: Playfield spacing on a phone
- **WHEN** the game is shown in a phone portrait layout
- **THEN** visible spacing separates the playfield from the HUD above it

#### Scenario: Theme does not affect play
- **WHEN** the same seed and actions are played under two different themes
- **THEN** the resulting boards, scores, levels, and announcements are identical

#### Scenario: Leaving the game
- **WHEN** browser Back returns to the catalog
- **THEN** the catalog's page background and browser theme color return to their catalog values

### Requirement: Theme legibility and offline assets
Within each theme, the seven tetromino types SHALL use seven distinct colors. Text and labels SHALL have at least 4.5:1 contrast against their surfaces. Focus indicators and button boundaries SHALL have at least 3:1 contrast. Themes SHALL use no network-loaded fonts or images.

#### Scenario: Theme palettes are inspected
- **WHEN** any theme's piece colors and UI colors are inspected
- **THEN** the seven piece colors are distinct and every text, label, focus, and button-boundary pair meets its contrast minimum

#### Scenario: Theme is used offline
- **WHEN** the installed application is offline and the user selects any theme
- **THEN** the theme renders completely without a network request

### Requirement: Theme selection and persistence
The pause menu SHALL include a Theme radio group after the Difficulty control and below the pause actions. The options SHALL appear as a single stacked list, and the selected theme SHALL be named in the group and visibly distinguished from the other rows. Each option SHALL show the theme's name and a small swatch in that theme. Selecting an option SHALL apply it immediately and save it on the device without changing the game state or leaving pause. A saved theme SHALL be restored on later launches and kept across restarts. Missing, invalid, or unavailable stored values SHALL use Classic.

#### Scenario: Theme picker is inspected
- **WHEN** the user opens the pause menu
- **THEN** a radio group named Theme lists Classic, Tron, Chocolate, Nature, Sketchbook, and Stained Glass, and the active theme is checked

#### Scenario: Theme is changed while paused
- **WHEN** the user selects a different theme in the pause menu
- **THEN** the new theme applies immediately, the game remains paused with an unchanged state, and the choice is saved for the next launch

#### Scenario: Theme is restored
- **WHEN** the user selects a theme and opens Block Drop again later on the same device
- **THEN** the game opens in the saved theme

#### Scenario: Stored theme is invalid or unavailable
- **WHEN** the saved theme is not a known theme or storage cannot be read
- **THEN** the game opens in Classic and remains playable

#### Scenario: Keyboard selection
- **WHEN** focus is in the Theme group and the user presses arrow keys
- **THEN** the selection moves between themes and each change applies and saves as if the option were tapped

### Requirement: Line milestone feedback
Whenever the cumulative cleared-line count reaches a new multiple of 10, Block Drop SHALL show a brief themed popup whose only text is the milestone count in the form “X lines cleared!”. The popup SHALL remain visible for 1800 milliseconds, SHALL use the active theme's colors and typography, and SHALL be approximately twice the compact presentation's size while remaining within the board frame. It SHALL NOT change or block gameplay. The existing game-announcement live region SHALL announce the same milestone text. The popup SHALL be absent at other line counts.

#### Scenario: A ten-line milestone is reached
- **WHEN** a line clear raises the cumulative total to 10 lines
- **THEN** a themed popup shows “10 lines cleared!” and the live announcement includes “10 lines cleared!”

#### Scenario: A later milestone is reached
- **WHEN** a line clear raises the cumulative total to 20, 30, or another multiple of 10
- **THEN** a new popup shows only the cumulative line count in the form “X lines cleared!”

#### Scenario: A milestone popup is visible
- **WHEN** the popup is displayed
- **THEN** movement, rotation, pause, and line-clear behavior continue normally, and the popup disappears after 1800 milliseconds

#### Scenario: Reduced motion is preferred
- **WHEN** the user has requested reduced motion and reaches a line milestone
- **THEN** the milestone popup is still shown without entrance or exit animation

#### Scenario: A game restarts during a milestone popup
- **WHEN** the user restarts while a milestone popup is visible
- **THEN** the popup is dismissed and the new game's milestone count starts from zero

## MODIFIED Requirements

### Requirement: Line-clear feedback
Block Drop SHALL visibly acknowledge every completed row before presenting the collapsed playfield. The feedback SHALL use the active theme's line-clear treatment. It SHALL identify the exact completed rows, and every effect SHALL start within those rows. The feedback SHALL last no longer than 900 milliseconds. Gravity and gameplay actions SHALL NOT advance the game until the feedback finishes. Restart actions and browser Back navigation SHALL remain available. Effects SHALL stay inside the playfield, SHALL be deterministic for the same rows and board, and SHALL NOT use random values that change between frames.

#### Scenario: One or more rows are completed
- **WHEN** a locking piece completes one or more rows
- **THEN** each completed row shows the active theme's clear treatment before the collapsed playfield is presented

#### Scenario: Themed clear treatments
- **WHEN** rows are cleared in each theme
- **THEN** Classic flashes the rows, Tron derezzes them behind a light beam, Chocolate melts the bars into dripping puddles, Nature turns the cells into leaves that drift down, Sketchbook erases them with a pencil eraser, and Stained Glass cracks and shatters them

#### Scenario: Chocolate clears multiple rows
- **WHEN** two or more adjacent rows clear in Chocolate
- **THEN** their cells melt as one stacked mass with a shared rippled top edge and shared drips below, while preserving the colors in vertically stacked bands

#### Scenario: Gameplay input arrives during clear feedback
- **WHEN** movement, rotation, soft-drop, hard-drop, or pause input arrives while line-clear feedback is active
- **THEN** the input does not advance or alter the game

#### Scenario: Clear feedback finishes
- **WHEN** the line-clear feedback completes
- **THEN** play resumes from the already determined collapsed board, next piece, and score without accumulated gravity time

#### Scenario: User restarts during clear feedback
- **WHEN** the user activates restart while line-clear feedback is active
- **THEN** the feedback ends and a fresh game starts immediately

#### Scenario: Reduced motion is preferred
- **WHEN** the user has requested reduced motion and a row is completed in any theme
- **THEN** the game presents the collapsed playfield without animated flashing, sweeping, melting, falling, or shattering motion

### Requirement: Readable playfield cells
Block Drop SHALL draw playfield grid lines beneath occupied cells so that grid lines do not cross locked or active pieces. Each occupied cell SHALL have a theme-defined boundary treatment, such as a bevel, glowing outline, embossed segment, pebble shading, pencil outline, or lead came. The treatment SHALL distinguish adjacent cells and similarly colored tetrominoes by more than flat fill color. In Classic, it SHALL be a lighter leading edge and a darker trailing edge. The treatment SHALL scale with cell size and stay sharp at the device pixel ratio. Theme texture details, such as hatching, speckles, or glass streaks, SHALL be deterministic for each cell and SHALL NOT flicker between frames.

#### Scenario: Occupied cell is rendered
- **WHEN** the playfield draws a locked or active cell
- **THEN** no grid line crosses the cell's interior and the cell shows the active theme's boundary treatment

#### Scenario: Display density changes
- **WHEN** the device pixel ratio or playfield size changes
- **THEN** cell boundaries are redrawn in proportion to the cell size and aligned to device pixels

#### Scenario: Board is redrawn without changes
- **WHEN** the same board is drawn twice
- **THEN** every cell's texture details are drawn identically
