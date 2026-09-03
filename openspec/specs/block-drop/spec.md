# Block Drop Specification

## Purpose

Provide the catalog's first complete game: an originally presented,
deterministic falling-block puzzle that is playable with touch or keyboard and
remains available from the installed offline application.

## Requirements

### Requirement: Catalog launch and return
The catalog SHALL present Block Drop as one playable game and SHALL let the
user return from an active game to the catalog.

#### Scenario: Launch Block Drop
- **WHEN** the user activates the Block Drop play control
- **THEN** the catalog is replaced by a new playable Block Drop session

#### Scenario: Return to the catalog
- **WHEN** the user activates the return control from Block Drop
- **THEN** the active session is destroyed and the catalog presents Block Drop as available to play again

### Requirement: Deterministic falling-block rules
Block Drop SHALL use a ten-column by twenty-row visible playfield, the seven
standard four-cell tetromino shapes, and seeded shuffled groups containing one
of each shape. Given the same seed and logical actions, the rules SHALL produce
the same states.

#### Scenario: New game starts
- **WHEN** a Block Drop session starts
- **THEN** the visible playfield is empty and one valid piece is active near its top

#### Scenario: Complete shuffled group
- **WHEN** seven consecutive pieces are drawn from a newly shuffled group
- **THEN** the group contains each supported tetromino shape exactly once

#### Scenario: Replay identical actions
- **WHEN** two games start with the same seed and receive the same logical actions
- **THEN** their resulting game states are identical

### Requirement: Core falling-block gameplay
Block Drop SHALL support automatic descent, horizontal movement, clockwise
rotation, soft drop, and hard drop. Movement SHALL not place cells outside the
playfield or through locked cells, pieces SHALL lock when they can no longer
descend, and every fully occupied row SHALL be removed after locking.

#### Scenario: Valid movement
- **WHEN** the user requests movement or rotation into a valid position
- **THEN** the active piece assumes the requested position

#### Scenario: Invalid movement
- **WHEN** the user requests movement or rotation that would collide with a boundary or locked cell
- **THEN** the active piece remains in its prior valid position

#### Scenario: Hard drop
- **WHEN** the user activates hard drop
- **THEN** the active piece moves to its lowest valid position and locks immediately

#### Scenario: Completed rows
- **WHEN** a piece locks and completes one or more rows
- **THEN** every completed row is removed and the rows above move downward

### Requirement: Line-clear feedback
Block Drop SHALL visibly acknowledge every completed row before presenting the collapsed playfield. The feedback SHALL identify the exact completed rows, remain brief enough not to interrupt the pace of play, and SHALL NOT permit gravity or gameplay actions to advance the game until the feedback finishes. Restart and return-to-catalog actions SHALL remain available.

#### Scenario: One or more rows are completed
- **WHEN** a locking piece completes one or more rows
- **THEN** each completed row receives a brief visible clear treatment before the collapsed playfield is presented

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
- **WHEN** the user has requested reduced motion and a row is completed
- **THEN** the game presents the collapsed playfield without animated flashing or sweeping motion

### Requirement: Deterministic score
Block Drop SHALL start each new game at zero points, add one point for every row
successfully advanced by soft drop, add two points for every row advanced by
hard drop, and add 100, 300, 500, or 800 points when a lock clears one, two,
three, or four rows together respectively. Automatic descent SHALL NOT award
drop points.

#### Scenario: New game starts
- **WHEN** a new Block Drop game starts
- **THEN** its score is zero

#### Scenario: Player soft drops
- **WHEN** soft drop successfully advances the active piece by one row
- **THEN** the score increases by one point

#### Scenario: Player hard drops
- **WHEN** hard drop advances the active piece by one or more rows before locking
- **THEN** the score increases by two points for each row advanced

#### Scenario: Automatic descent advances
- **WHEN** gravity advances the active piece
- **THEN** the score does not change

#### Scenario: Rows clear together
- **WHEN** a lock clears one, two, three, or four rows simultaneously
- **THEN** the score additionally increases by 100, 300, 500, or 800 points respectively

#### Scenario: Game ends
- **WHEN** the game reaches game over
- **THEN** the final score remains displayed until the user restarts or leaves

#### Scenario: User restarts
- **WHEN** the user starts a fresh game
- **THEN** the score resets to zero

### Requirement: Next-piece preview
Block Drop SHALL identify and visualize the exact tetromino that will become
active after the current piece locks. The preview SHALL use the piece's initial
orientation, SHALL remain consistent with seeded piece generation, and SHALL
center the occupied-cell bounds of every supported tetromino horizontally and
vertically within a preview frame large enough to show the four-cell I piece
without clipping or changing cell scale.

#### Scenario: Game starts
- **WHEN** a new game creates its first active piece
- **THEN** the following piece is immediately shown in the next-piece preview

#### Scenario: Active piece locks
- **WHEN** the active piece locks and the previewed piece enters play
- **THEN** the preview updates to the subsequent generated piece

#### Scenario: Any supported piece is previewed
- **WHEN** the next piece is any of the seven supported tetrominoes
- **THEN** its occupied-cell bounds are centered on the same horizontal and vertical midpoint without clipping

#### Scenario: Preview is inspected semantically
- **WHEN** a user or assistive technology inspects the next-piece preview
- **THEN** both a shape visualization and a readable tetromino identifier are available

### Requirement: Manual pause and resume
Block Drop SHALL let the user pause and resume an active game without changing
the board, active piece, next piece, or score. While paused, gravity and
movement, rotation, soft-drop, and hard-drop actions SHALL have no effect.

#### Scenario: User pauses active play
- **WHEN** the user activates pause during an active game
- **THEN** the state becomes paused and the current board, piece, preview, and score remain unchanged

#### Scenario: Time passes while paused
- **WHEN** animation frames continue while the game is paused
- **THEN** the active piece does not descend and no paused time accumulates toward a later gravity step

#### Scenario: Gameplay input arrives while paused
- **WHEN** the user requests movement, rotation, soft drop, or hard drop while paused
- **THEN** the game state remains unchanged

#### Scenario: User resumes
- **WHEN** the user activates resume from the paused state
- **THEN** active play continues from the same board, piece, preview, and score with a fresh gravity interval

#### Scenario: User restarts while paused
- **WHEN** the user activates restart from the paused state
- **THEN** a fresh unpaused game starts with score zero

### Requirement: Game over and restart
Block Drop SHALL end the game when a newly spawned piece has no valid position
and SHALL allow the user to start a fresh game.

#### Scenario: Spawn area is obstructed
- **WHEN** the next piece cannot occupy its initial position
- **THEN** automatic descent and gameplay actions stop and the game-over state is shown

#### Scenario: Restart after game over
- **WHEN** the user activates restart from the game-over state
- **THEN** a new game starts with an empty playfield and an active piece

### Requirement: Keyboard and touch play
Every gameplay action SHALL be available through visible touch controls and
through keyboard controls, with both input methods producing the same logical
actions. The visible controls SHALL use familiar directional and action labels,
and the pause control SHALL become a resume control while paused.

#### Scenario: Touch action
- **WHEN** the user activates a visible movement, rotation, soft-drop, hard-drop, pause/resume, or restart control
- **THEN** the corresponding logical action is applied once

#### Scenario: Keyboard action
- **WHEN** the active game receives the documented key for a movement, rotation, soft-drop, hard-drop, pause/resume, or restart action
- **THEN** the same logical action as the corresponding visible control is applied

#### Scenario: Control meaning is inspected
- **WHEN** a user or assistive technology inspects a gameplay control
- **THEN** its movement, drop, pause/resume, or restart action is unambiguous without requiring interpretation of an icon alone

### Requirement: Clear control hierarchy and feedback
Block Drop SHALL present catalog, navigation, movement, drop, pause, and restart controls with consistent touch-friendly sizing and a visual hierarchy that distinguishes primary gameplay actions from secondary session actions. The movement group SHALL present left, right, rotate, and soft drop in that visual and reading order, with left and right adjacent and rotate immediately to the right of right. Every control SHALL expose visible keyboard focus and appropriate hover, pressed, and disabled feedback without relying on color alone.

#### Scenario: User scans the gameplay controls
- **WHEN** the Block Drop play screen is presented
- **THEN** related movement and drop controls are visually grouped and pause, restart, and catalog actions are distinguishable from moment-to-moment gameplay actions

#### Scenario: User scans movement controls
- **WHEN** the movement control group is presented at any supported viewport
- **THEN** left and right are adjacent, rotate immediately follows right, and soft drop follows rotate in visual and reading order

#### Scenario: User operates a pointer control
- **WHEN** a pointer hovers over or presses an enabled button
- **THEN** the button provides visible hover or pressed feedback without moving surrounding content

#### Scenario: User navigates controls by keyboard
- **WHEN** keyboard focus reaches a button
- **THEN** a high-contrast focus indicator is visible around that button

#### Scenario: A control is unavailable
- **WHEN** a gameplay control is disabled
- **THEN** it is visibly and semantically unavailable while its label remains readable

#### Scenario: User operates a touch control
- **WHEN** the user targets a visible catalog, navigation, or gameplay button on a phone viewport
- **THEN** the control provides a target of at least 44 by 44 CSS pixels

### Requirement: Responsive and accessible presentation
Block Drop SHALL render an originally styled playfield and next-piece preview
sharply within its available phone viewport in portrait and landscape
orientations. When sufficient horizontal space is available, a prominent game
HUD SHALL appear to the right of the playfield with the score as its strongest
numeric element and an enlarged next-piece preview. On constrained viewports,
the same HUD information SHALL remain prominent in a compact arrangement
without forcing page scrolling. The score, next-piece identity, game state,
clear feedback, and controls SHALL have readable text or accessible names
rather than requiring Canvas pixels, motion, or color interpretation alone.

#### Scenario: Wide viewport is presented
- **WHEN** the game has sufficient horizontal space for the playfield and game HUD
- **THEN** the score and enlarged next-piece preview are grouped in a dedicated region to the right of the playfield

#### Scenario: Constrained viewport is presented
- **WHEN** a side-by-side playfield and game HUD would prevent the complete game from fitting
- **THEN** the HUD adopts a compact arrangement while the playfield, score, preview, state, and controls remain visible and usable without page scrolling

#### Scenario: Viewport changes
- **WHEN** the game container changes size or device pixel ratio
- **THEN** the complete playfield, score, next-piece preview, state, and controls remain usable and the Canvas backing resolution matches its displayed size

#### Scenario: Controls and state are inspected semantically
- **WHEN** a user or assistive technology inspects the active game
- **THEN** the game name, score, next-piece identity, current playing, paused, clearing, or game-over state, and every available control have readable labels

### Requirement: Session resource cleanup
Leaving Block Drop SHALL stop its simulation and rendering and remove
game-specific input and resize observation.

#### Scenario: Active game is destroyed
- **WHEN** the user returns to the catalog or the game component unmounts
- **THEN** no game animation frame, timer, keyboard handler, or resize observer remains active

### Requirement: Offline play after first load
Block Drop SHALL remain launchable and playable from the production application
after its current deployment has loaded successfully online and connectivity is
then removed.

#### Scenario: Launch the game offline
- **WHEN** the current production application has loaded online, the browser becomes offline, and the user opens Block Drop
- **THEN** the game renders and accepts gameplay input without a network error
