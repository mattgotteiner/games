## ADDED Requirements

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
orientation and SHALL remain consistent with seeded piece generation.

#### Scenario: Game starts
- **WHEN** a new game creates its first active piece
- **THEN** the following piece is immediately shown in the next-piece preview

#### Scenario: Active piece locks
- **WHEN** the active piece locks and the previewed piece enters play
- **THEN** the preview updates to the subsequent generated piece

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

## MODIFIED Requirements

### Requirement: Keyboard and touch play
Every gameplay action SHALL be available through visible touch controls and
through keyboard controls, with both input methods producing the same logical
actions. The pause control SHALL become a resume control while paused.

#### Scenario: Touch action
- **WHEN** the user activates a visible movement, rotation, soft-drop, hard-drop, pause/resume, or restart control
- **THEN** the corresponding logical action is applied once

#### Scenario: Keyboard action
- **WHEN** the active game receives the documented key for a movement, rotation, soft-drop, hard-drop, pause/resume, or restart action
- **THEN** the same logical action as the corresponding visible control is applied

### Requirement: Responsive and accessible presentation
Block Drop SHALL render an originally styled playfield and next-piece preview
sharply within its available phone viewport in portrait and landscape
orientations. The score, next-piece identity, game state, and controls SHALL
have readable text or accessible names rather than requiring Canvas pixels or
color interpretation alone.

#### Scenario: Viewport changes
- **WHEN** the game container changes size or device pixel ratio
- **THEN** the complete playfield, score, next-piece preview, state, and controls remain usable and the Canvas backing resolution matches its displayed size

#### Scenario: Controls and state are inspected semantically
- **WHEN** a user or assistive technology inspects the active game
- **THEN** the game name, score, next-piece identity, current playing, paused, or game-over state, and every available control have readable labels
