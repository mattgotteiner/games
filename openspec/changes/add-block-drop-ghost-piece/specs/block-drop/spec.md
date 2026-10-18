## ADDED Requirements

### Requirement: Landing preview
Block Drop SHALL show where the active piece would lock if hard dropped, as an outline of the active piece's cells at its lowest valid position. The preview SHALL be visually distinct from both the active piece and locked cells. The landing position SHALL be computed by the same rules logic that hard drop uses, SHALL update after every movement, rotation, gravity step, and spawn, and SHALL NOT be part of the deterministic game state. The preview SHALL NOT be drawn while no active piece is shown, and SHALL NOT be drawn where it coincides with the active piece.

#### Scenario: Piece enters play
- **WHEN** a new active piece spawns above empty rows
- **THEN** an outline of that piece appears at the lowest position it can occupy in its current column and rotation

#### Scenario: Piece moves or rotates
- **WHEN** the active piece moves horizontally or rotates
- **THEN** the landing preview moves to the new lowest valid position for that column and rotation

#### Scenario: Player hard drops
- **WHEN** the user activates hard drop
- **THEN** the piece locks in exactly the cells the landing preview showed

#### Scenario: Piece already rests at its landing position
- **WHEN** the active piece cannot descend further
- **THEN** only the active piece is drawn and no separate landing preview is visible

#### Scenario: No active piece is shown
- **WHEN** line-clear feedback is active or the game is over
- **THEN** no landing preview is drawn

### Requirement: Readable playfield cells
Block Drop SHALL draw playfield grid lines beneath occupied cells so that grid lines do not cross locked or active pieces. Each occupied cell SHALL carry an edge treatment, a lighter leading edge and a darker trailing edge, so that adjacent cells and similarly colored tetrominoes are distinguishable by more than flat fill color. The edge treatment SHALL scale with cell size and remain sharp at the device pixel ratio.

#### Scenario: Occupied cell is rendered
- **WHEN** the playfield draws a locked or active cell
- **THEN** no grid line is drawn across the cell's interior and the cell shows a lighter leading edge and a darker trailing edge

#### Scenario: Display density changes
- **WHEN** the device pixel ratio or playfield size changes
- **THEN** cell edges are redrawn at a thickness proportional to the cell size and aligned to device pixels
