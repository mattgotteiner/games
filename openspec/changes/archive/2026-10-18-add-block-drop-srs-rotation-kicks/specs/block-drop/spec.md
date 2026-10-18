## MODIFIED Requirements

### Requirement: Core falling-block gameplay
Block Drop SHALL support automatic descent, horizontal movement, clockwise
rotation, soft drop, and hard drop. I and JLSTZ pieces SHALL use the
orientation-specific five-test SRS kick table for each clockwise transition:

| Piece family | Transition | Ordered `(x, y)` offsets |
| --- | --- | --- |
| JLSTZ | 0→R | `(0,0), (-1,0), (-1,-1), (0,2), (-1,2)` |
| JLSTZ | R→2 | `(0,0), (1,0), (1,1), (0,-2), (1,-2)` |
| JLSTZ | 2→L | `(0,0), (1,0), (1,-1), (0,2), (1,2)` |
| JLSTZ | L→0 | `(0,0), (-1,0), (-1,1), (0,-2), (-1,-2)` |
| I | 0→R | `(0,0), (-2,0), (1,0), (-2,1), (1,-2)` |
| I | R→2 | `(0,0), (-1,0), (2,0), (-1,-2), (2,1)` |
| I | 2→L | `(0,0), (2,0), (-1,0), (2,-1), (-1,2)` |
| I | L→0 | `(0,0), (1,0), (-2,0), (1,-2), (-2,1)` |

Here `0`, `R`, `2`, and `L` are rotations 0, 1, 2, and 3; positive X is
right and positive Y is down. The first candidate that fits SHALL be used. If
none fit, the piece SHALL keep its prior position and orientation. A rotated
piece MAY occupy cells above visible row 0; those cells SHALL be treated as
empty, and if the piece locks while any cell remains above row 0, the game
SHALL end without writing outside the board. The O piece SHALL remain
unchanged when rotated. Movement SHALL not place cells outside the playfield
or through locked cells, pieces SHALL lock when they can no longer descend,
and every fully occupied row SHALL be removed after locking.

#### Scenario: Clockwise rotation uses the transition's first valid kick
- **WHEN** a clockwise rotation collides and one or more offsets in the table for that transition produce a valid position
- **THEN** the piece rotates at the first valid position in the transition's ordered table

#### Scenario: Rotation uses an upward kick
- **WHEN** a listed kick moves a rotated piece above visible row 0 and its other cells remain valid
- **THEN** the rotation succeeds and the active piece may occupy the hidden area above the visible board

#### Scenario: Piece locks above the visible board
- **WHEN** gravity or a drop locks a piece with any cell above row 0
- **THEN** the game enters game over and the board remains within its 20 visible rows

#### Scenario: Every SRS kick candidate collides
- **WHEN** the rotated piece collides at all five candidate positions
- **THEN** the piece remains in its prior position and orientation

#### Scenario: O piece is rotated
- **WHEN** the user requests a clockwise rotation for an O piece
- **THEN** the O piece remains in the same position and orientation

#### Scenario: Hard drop
- **WHEN** the user activates hard drop
- **THEN** the active piece moves to its lowest valid position and locks immediately

#### Scenario: Completed rows
- **WHEN** a piece locks and completes one or more rows
- **THEN** every completed row is removed and the rows above move downward
