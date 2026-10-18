## MODIFIED Requirements

### Requirement: Catalog launch and browser return
The catalog SHALL present Block Drop as one playable game. Block Drop SHALL
NOT present an in-game `Catalog` or `Back to catalog` button. When Block Drop
is launched from the catalog, browser Back SHALL return to the catalog and
destroy the active session.

#### Scenario: Return to the catalog through browser history
- **WHEN** the user uses browser Back after launching Block Drop from the catalog
- **THEN** the active session is destroyed and the catalog presents Block Drop as available to play again

### Requirement: Game over and restart

Block Drop SHALL end the game when a newly spawned piece has no valid position
or when a piece locks with cells above visible row 0, and SHALL allow the user
to start a fresh game. At game over, a card over the playfield SHALL present
the final score, the best score, an indication when the final score set a new
best, and a play-again action that receives focus. The game-over card SHALL NOT
include a `Back to catalog` button, and the game header SHALL NOT expose a
`Catalog` control. Browser Back SHALL return to the catalog when browser
history includes the catalog launch. The game-over state SHALL be
conveyed with readable text rather than Canvas-drawn text.

#### Scenario: Spawn area is obstructed
- **WHEN** the next piece cannot occupy its initial position
- **THEN** automatic descent and gameplay actions stop and the game-over state is shown

#### Scenario: Piece locks above the visible board
- **WHEN** a piece is locked while any of its cells remain above row 0
- **THEN** the game-over state is shown without changing the visible board

#### Scenario: Game-over card presents its actions
- **WHEN** the game reaches game over
- **THEN** the card shows the final score and best score, indicates a new best when applicable, and focuses `Play again`
- **AND** neither the game-over card nor the game header shows a catalog button

#### Scenario: Restart after game over
- **WHEN** the user activates `Play again` from the game-over card
- **THEN** a new game starts with an empty playfield and an active piece
