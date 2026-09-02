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
actions.

#### Scenario: Touch action
- **WHEN** the user activates a visible movement, rotation, soft-drop, or hard-drop control
- **THEN** the corresponding logical action is applied once

#### Scenario: Keyboard action
- **WHEN** the active game receives the documented key for a movement, rotation, soft-drop, hard-drop, or restart action
- **THEN** the same logical action as the corresponding visible control is applied

### Requirement: Responsive and accessible presentation
Block Drop SHALL render an originally styled playfield sharply within its
available phone viewport in portrait and landscape orientations. Game state and
controls SHALL have readable text or accessible names rather than requiring
Canvas pixels or color interpretation alone.

#### Scenario: Viewport changes
- **WHEN** the game container changes size or device pixel ratio
- **THEN** the complete playfield remains visible and the Canvas backing resolution matches its displayed size

#### Scenario: Controls and state are inspected semantically
- **WHEN** a user or assistive technology inspects the active game
- **THEN** the game name, current playing or game-over state, and every available control have readable labels

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
