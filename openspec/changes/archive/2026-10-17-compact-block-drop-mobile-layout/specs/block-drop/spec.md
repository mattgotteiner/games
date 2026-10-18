## MODIFIED Requirements

### Requirement: Visible scoring explanation
Block Drop SHALL make a scoring guide available on demand from a labelled help control that is always visible in the game header. The guide SHALL open in a modal dialog that states that each successful soft-drop row earns 1 point, each hard-drop row earns 2 points, automatic gravity earns no points, and clearing one, two, three, or four lines at once earns 100, 300, 500, or 800 points respectively, and SHALL also list the keyboard controls. The displayed values SHALL remain consistent with the deterministic score calculation. Opening the guide during active play SHALL pause the game, and closing the guide SHALL leave the game paused and return focus to the help control.

#### Scenario: Player inspects the score
- **WHEN** the user activates the help control
- **THEN** a dialog identifies every action that can change the score, the number of points it awards, and the keyboard controls

#### Scenario: Guide opens during active play
- **WHEN** the user opens the scoring guide while the game is playing
- **THEN** the game becomes paused before the guide is presented

#### Scenario: Player closes the guide
- **WHEN** the user closes the scoring guide
- **THEN** the game remains in its paused or game-over state and focus returns to the help control

#### Scenario: Player presses soft drop
- **WHEN** a successful soft drop increases the score by one point and the user opens the scoring guide
- **THEN** the guide explains that soft drop earns one point per row

#### Scenario: Automatic gravity advances
- **WHEN** gravity moves a piece downward without changing the score and the user opens the scoring guide
- **THEN** the guide explains that automatic gravity earns no points

#### Scenario: Constrained viewport is presented
- **WHEN** the scoring guide is opened on a portrait or short-landscape phone viewport
- **THEN** the complete guide is readable within the dialog without clipping and without forcing the page to scroll

#### Scenario: Scoring guide is inspected semantically
- **WHEN** a user or assistive technology inspects the scoring guide
- **THEN** the dialog has a readable name and associates each scoring action with its point value

### Requirement: Responsive and accessible presentation
Block Drop SHALL render an originally styled playfield and next-piece preview sharply within its available phone viewport in portrait and landscape orientations, and SHALL give the playfield the largest share of the available space. The game header SHALL occupy a single compact row. The visible playfield frame SHALL fit the rendered playfield rather than spanning unused width. On a 390 by 844 CSS pixel portrait viewport, the displayed playfield SHALL be at least 540 CSS pixels tall. When sufficient horizontal space is available, a game HUD SHALL appear to the right of the playfield with the score as its strongest numeric element and an enlarged next-piece preview. On portrait phone viewports, the score, game state, and next-piece preview SHALL appear in a single compact strip between the header and the playfield. No supported viewport SHALL require page scrolling. The score, next-piece identity, game state, clear feedback, and controls SHALL have readable text or accessible names rather than requiring Canvas pixels, motion, or color interpretation alone.

#### Scenario: Wide viewport is presented
- **WHEN** the game has sufficient horizontal space for the playfield and game HUD
- **THEN** the score and enlarged next-piece preview are grouped in a dedicated region to the right of the playfield

#### Scenario: Portrait phone viewport is presented
- **WHEN** the game is shown at 390 by 844 CSS pixels
- **THEN** the score, state, and next-piece preview share one compact strip above the playfield and the playfield is displayed at least 540 CSS pixels tall without page scrolling

#### Scenario: Constrained viewport is presented
- **WHEN** a side-by-side playfield and game HUD would prevent the complete game from fitting
- **THEN** the HUD adopts a compact arrangement while the playfield, score, preview, state, and controls remain visible and usable without page scrolling

#### Scenario: Playfield frame is presented
- **WHEN** the playfield is narrower than the space available to it
- **THEN** the visible frame surrounds the playfield itself rather than the full available width

#### Scenario: Viewport changes
- **WHEN** the game container changes size or device pixel ratio
- **THEN** the complete playfield, score, next-piece preview, state, and controls remain usable and the Canvas backing resolution matches its displayed size

#### Scenario: Controls and state are inspected semantically
- **WHEN** a user or assistive technology inspects the active game
- **THEN** the game name, score, next-piece identity, current playing, paused, clearing, or game-over state, and every available control have readable labels

## ADDED Requirements

### Requirement: Session action placement
Block Drop SHALL present pause/resume, help, and restart as session actions that are visually and structurally separate from the movement, rotation, and drop controls. No session action SHALL be adjacent to the hard-drop control. Keyboard shortcuts for pause and restart SHALL remain available regardless of where the visible session actions are placed.

#### Scenario: User scans the gameplay controls
- **WHEN** the Block Drop play screen is presented at any supported viewport
- **THEN** the gameplay control groups contain only movement, rotation, soft-drop, and hard-drop controls, and no session action sits beside the hard-drop control

#### Scenario: User restarts from the keyboard
- **WHEN** the user presses the documented restart key during active play
- **THEN** a fresh game starts as before

### Requirement: Concise live announcements
Block Drop SHALL announce line clears, pause, resume, and game over through a single polite status region, and SHALL NOT announce score changes caused only by soft-drop or hard-drop rows. The current score SHALL remain readable on demand.

#### Scenario: Player soft drops
- **WHEN** a soft drop changes the score without clearing a line
- **THEN** no live announcement is made

#### Scenario: Lines are cleared
- **WHEN** a lock clears one or more lines
- **THEN** a single announcement states the number of lines cleared and the new score

#### Scenario: Game state changes
- **WHEN** the game is paused, resumed, or reaches game over
- **THEN** a single announcement states the new state
