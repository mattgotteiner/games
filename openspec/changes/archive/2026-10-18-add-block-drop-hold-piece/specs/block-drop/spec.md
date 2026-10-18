## ADDED Requirements

### Requirement: Hold piece
Block Drop SHALL provide one optional hold slot for the active tetromino. A
hold action SHALL be available only while the game is playing and at most once
per active piece. When the slot is empty, holding SHALL store the active piece,
spawn the queued next piece in its initial orientation, and draw the following
piece from the existing deterministic queue. When the slot is occupied, holding
SHALL swap the active and held piece types, placing the incoming piece at its
initial spawn position and orientation without changing the next piece or
random queue. Hold SHALL NOT change the board, score, lines, level, or
difficulty. A successful hold SHALL remain unavailable until the active piece
locks and a new piece spawns. Restart SHALL clear the hold slot and restore
hold availability. The HUD SHALL show whether the slot is empty or identify and
preview the held tetromino. Hold SHALL be available through a visible control
and the C key at every difficulty. In portrait phone layouts, the Hold control
SHALL be centered between the movement and rotate/drop control groups, and
vertically centered between Rotate and Hard drop, with at least 16 CSS pixels
of whitespace between Hold and either neighboring control group.

#### Scenario: Hold slot is empty
- **WHEN** the player holds the active piece for the first time
- **THEN** that piece appears in the hold slot, the queued next piece becomes active, and the next preview advances once

#### Scenario: Hold slot is occupied
- **WHEN** the player holds while a piece is saved in the slot
- **THEN** the active and held piece types swap, both use their initial orientation, and the next preview remains unchanged

#### Scenario: Hold is used twice before locking
- **WHEN** the player requests hold again before the active piece locks
- **THEN** the game state remains unchanged and the hold control is unavailable

#### Scenario: A piece locks after hold
- **WHEN** the active piece locks after a successful hold
- **THEN** the newly spawned active piece can be held once

#### Scenario: Hold spawn collides
- **WHEN** a held or queued piece cannot occupy its initial spawn position
- **THEN** the game enters the existing game-over state

#### Scenario: Hold input arrives while paused or over
- **WHEN** the player requests hold while the game is paused or over
- **THEN** the game state remains unchanged

#### Scenario: Hold is replayed with the same seed
- **WHEN** two games start with the same seed and receive the same actions including hold
- **THEN** their held piece, active piece, next preview, queue, and board remain identical

#### Scenario: Hold is inspected accessibly
- **WHEN** a user or assistive technology inspects the hold slot and control
- **THEN** the slot identifies its piece or empty state and the control is named `Hold piece` with its C-key shortcut

#### Scenario: Hold is available at every difficulty
- **WHEN** the player starts a game at Easy, Medium, or Hard difficulty
- **THEN** hold is available under the same once-per-piece rule
