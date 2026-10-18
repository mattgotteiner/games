## MODIFIED Requirements

### Requirement: Core falling-block gameplay
Block Drop SHALL support automatic descent, horizontal movement, clockwise
rotation, soft drop, and hard drop. When a clockwise rotation does not fit at
its current position, the rules SHALL try horizontal offsets in this order:
`0, +1, -1` for J, L, S, T, and Z pieces; `0, +1, -1, +2, -2` for I pieces.
The first valid position SHALL be used. The rules SHALL refuse the rotation if
every candidate collides. Rotation kicks SHALL NOT shift pieces vertically. The
O piece SHALL remain unchanged when rotated. Movement SHALL not place cells
outside the playfield or through locked cells, pieces SHALL lock when they can
no longer descend, and every fully occupied row SHALL be removed after locking.

#### Scenario: Rotation uses the first valid horizontal offset
- **WHEN** a clockwise rotation collides at its current position and one or more listed horizontal offsets produce a valid position
- **THEN** the piece rotates at the first valid offset in the documented order

#### Scenario: Valid movement
- **WHEN** the user requests horizontal movement or rotation into a valid position
- **THEN** the active piece assumes the requested position

#### Scenario: Invalid horizontal movement
- **WHEN** the user requests horizontal movement that would collide with a boundary or locked cell
- **THEN** the active piece remains in its prior valid position

#### Scenario: Every horizontal offset collides
- **WHEN** a clockwise rotation collides at its current position and every listed horizontal offset also collides
- **THEN** the piece remains in its prior position and orientation

#### Scenario: Rotation is blocked by the board edge
- **WHEN** an I piece next to a wall rotates and its new orientation extends beyond the playfield
- **THEN** the rules try the listed horizontal offsets and keep the first valid position within the playfield

#### Scenario: O piece is rotated
- **WHEN** the user requests a clockwise rotation for an O piece
- **THEN** the O piece remains in the same position and orientation

#### Scenario: Hard drop
- **WHEN** the user activates hard drop
- **THEN** the active piece moves to its lowest valid position and locks immediately

#### Scenario: Completed rows
- **WHEN** a piece locks and completes one or more rows
- **THEN** every completed row is removed and the rows above move downward
