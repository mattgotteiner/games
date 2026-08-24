## Purpose

Provide the catalog's first complete game: an originally branded, deterministic falling-block puzzle designed for touch-first mobile play and keyboard use.

## ADDED Requirements

### Requirement: Falling-block playfield
Block Drop SHALL use a ten-column by twenty-row visible playfield and the seven standard four-cell tetromino shapes, spawning pieces above or at the top of the visible playfield.

#### Scenario: New game starts
- **WHEN** the user starts a new game
- **THEN** the playfield is empty, the score and cleared-line count are zero, and the first playable piece is active

#### Scenario: Piece cannot descend
- **WHEN** an active piece can no longer move downward and its lock delay expires
- **THEN** its cells become part of the playfield and the next piece enters play

### Requirement: Deterministic piece generation
Block Drop SHALL generate pieces in shuffled groups containing one of each supported shape, and its rules engine SHALL produce repeatable outcomes when given the same initial seed, elapsed simulation steps, and logical actions.

#### Scenario: Complete generation group
- **WHEN** seven consecutive pieces are drawn from a newly shuffled group
- **THEN** the seven pieces contain each supported shape exactly once

#### Scenario: Replay identical inputs
- **WHEN** two new games use the same seed and receive the same time steps and logical actions
- **THEN** their resulting game states are identical

### Requirement: Movement controls
Block Drop SHALL support horizontal movement, clockwise and counterclockwise rotation with bounded wall kicks, soft drop, hard drop, pause, and restart through both keyboard and touch-accessible controls.

#### Scenario: Valid movement
- **WHEN** the user requests movement or rotation that does not collide with the playfield boundary or locked cells
- **THEN** the active piece assumes the requested valid position

#### Scenario: Invalid movement
- **WHEN** the requested movement or all allowed kicked rotations would collide
- **THEN** the active piece remains in its prior valid position

#### Scenario: Hard drop
- **WHEN** the user activates hard drop
- **THEN** the active piece moves to its lowest valid position and locks without waiting for additional gravity

### Requirement: Line clearing and scoring
Block Drop SHALL remove every completely occupied row after a piece locks, award points based on the number of rows cleared together, award drop-distance points, and increase the level after each ten cumulative cleared rows.

#### Scenario: Multiple rows are completed
- **WHEN** a locking piece completes one or more rows
- **THEN** all completed rows are removed together, rows above move downward, and the score and line count increase

#### Scenario: Level threshold is reached
- **WHEN** the cumulative cleared-line count reaches the next multiple of ten
- **THEN** the level increases and subsequent automatic descent uses a shorter interval

#### Scenario: Player drops a piece manually
- **WHEN** a soft or hard drop advances the active piece
- **THEN** the score increases according to the number of rows advanced and the drop type

### Requirement: Game completion and session controls
Block Drop SHALL end the game when a newly spawned piece has no valid position and SHALL allow the user to pause, resume, or start a new game.

#### Scenario: Spawn area is obstructed
- **WHEN** the next piece cannot occupy its initial spawn position
- **THEN** automatic movement and gameplay input stop and the game-over state displays the final score

#### Scenario: User pauses
- **WHEN** the user pauses an active game
- **THEN** simulation time and gameplay actions stop until the session resumes

### Requirement: High score persistence
Block Drop SHALL retain the highest completed score on the current device using versioned local data.

#### Scenario: Player exceeds the stored high score
- **WHEN** a game ends with a score higher than the stored high score
- **THEN** the new value is persisted and displayed

#### Scenario: Player does not exceed the stored high score
- **WHEN** a game ends without exceeding the stored high score
- **THEN** the existing high score remains unchanged

### Requirement: Accessible game status
Block Drop SHALL expose score, level, line count, pause state, and game-over state as readable text, and SHALL NOT rely on color alone to distinguish game state or controls.

#### Scenario: Assistive technology reads status
- **WHEN** the score or session state changes
- **THEN** the current values remain available through semantic text without requiring interpretation of the canvas

