## MODIFIED Requirements

### Requirement: Core falling-block gameplay
Block Drop SHALL support automatic descent, horizontal movement, clockwise rotation, soft drop, and hard drop. Movement SHALL not place cells outside the playfield or through locked cells, pieces SHALL lock when they can no longer descend, and every fully occupied row SHALL be removed after locking. When a clockwise rotation is invalid in place, Block Drop SHALL try the rotated piece shifted one column right, then one column left, and for the I tetromino also two columns right, then two columns left, and SHALL apply the first valid candidate. Rotation SHALL NOT shift a piece vertically.

#### Scenario: Valid movement
- **WHEN** the user requests movement or rotation into a valid position
- **THEN** the active piece assumes the requested position

#### Scenario: Rotation against a wall
- **WHEN** the user rotates a piece whose rotated shape would extend past a wall by one column, or by up to two columns for the I tetromino
- **THEN** the piece rotates and shifts horizontally to the first valid position in the documented order

#### Scenario: Invalid movement
- **WHEN** the user requests horizontal movement that would collide with a boundary or locked cell
- **THEN** the active piece remains in its prior valid position

#### Scenario: Rotation with no valid candidate
- **WHEN** the user requests a rotation for which the in-place position and every documented horizontal shift collide with a boundary or locked cell
- **THEN** the active piece remains in its prior valid position and rotation

#### Scenario: Hard drop
- **WHEN** the user activates hard drop
- **THEN** the active piece moves to its lowest valid position and locks immediately

#### Scenario: Completed rows
- **WHEN** a piece locks and completes one or more rows
- **THEN** every completed row is removed and the rows above move downward
