## ADDED Requirements

### Requirement: Line-clear feedback
Block Drop SHALL visibly acknowledge every completed row before presenting the collapsed playfield. The feedback SHALL identify the exact completed rows, remain brief enough not to interrupt the pace of play, and SHALL NOT permit gravity or gameplay actions to advance the game until the feedback finishes. Restart and return-to-catalog actions SHALL remain available.

#### Scenario: One or more rows are completed
- **WHEN** a locking piece completes one or more rows
- **THEN** each completed row receives a brief visible clear treatment before the collapsed playfield is presented

#### Scenario: Gameplay input arrives during clear feedback
- **WHEN** movement, rotation, soft-drop, hard-drop, or pause input arrives while line-clear feedback is active
- **THEN** the input does not advance or alter the game

#### Scenario: Clear feedback finishes
- **WHEN** the line-clear feedback completes
- **THEN** play resumes from the already determined collapsed board, next piece, and score without accumulated gravity time

#### Scenario: User restarts during clear feedback
- **WHEN** the user activates restart while line-clear feedback is active
- **THEN** the feedback ends and a fresh game starts immediately

#### Scenario: Reduced motion is preferred
- **WHEN** the user has requested reduced motion and a row is completed
- **THEN** the game presents the collapsed playfield without animated flashing or sweeping motion

### Requirement: Clear control hierarchy and feedback
Block Drop SHALL present catalog, navigation, movement, drop, pause, and restart controls with consistent touch-friendly sizing and a visual hierarchy that distinguishes primary gameplay actions from secondary session actions. Every control SHALL expose visible keyboard focus and appropriate hover, pressed, and disabled feedback without relying on color alone.

#### Scenario: User scans the gameplay controls
- **WHEN** the Block Drop play screen is presented
- **THEN** related movement and drop controls are visually grouped and pause, restart, and catalog actions are distinguishable from moment-to-moment gameplay actions

#### Scenario: User operates a pointer control
- **WHEN** a pointer hovers over or presses an enabled button
- **THEN** the button provides visible hover or pressed feedback without moving surrounding content

#### Scenario: User navigates controls by keyboard
- **WHEN** keyboard focus reaches a button
- **THEN** a high-contrast focus indicator is visible around that button

#### Scenario: A control is unavailable
- **WHEN** a gameplay control is disabled
- **THEN** it is visibly and semantically unavailable while its label remains readable

#### Scenario: User operates a touch control
- **WHEN** the user targets a visible catalog, navigation, or gameplay button on a phone viewport
- **THEN** the control provides a target of at least 44 by 44 CSS pixels

## MODIFIED Requirements

### Requirement: Keyboard and touch play
Every gameplay action SHALL be available through visible touch controls and through keyboard controls, with both input methods producing the same logical actions. The visible controls SHALL use familiar directional and action labels, and the pause control SHALL become a resume control while paused.

#### Scenario: Touch action
- **WHEN** the user activates a visible movement, rotation, soft-drop, hard-drop, pause/resume, or restart control
- **THEN** the corresponding logical action is applied once

#### Scenario: Keyboard action
- **WHEN** the active game receives the documented key for a movement, rotation, soft-drop, hard-drop, pause/resume, or restart action
- **THEN** the same logical action as the corresponding visible control is applied

#### Scenario: Control meaning is inspected
- **WHEN** a user or assistive technology inspects a gameplay control
- **THEN** its movement, drop, pause/resume, or restart action is unambiguous without requiring interpretation of an icon alone

### Requirement: Responsive and accessible presentation
Block Drop SHALL render an originally styled playfield and next-piece preview sharply within its available phone viewport in portrait and landscape orientations. When sufficient horizontal space is available, a prominent game HUD SHALL appear to the right of the playfield with the score as its strongest numeric element and an enlarged next-piece preview. On constrained viewports, the same HUD information SHALL remain prominent in a compact arrangement without forcing page scrolling. The score, next-piece identity, game state, clear feedback, and controls SHALL have readable text or accessible names rather than requiring Canvas pixels, motion, or color interpretation alone.

#### Scenario: Wide viewport is presented
- **WHEN** the game has sufficient horizontal space for the playfield and game HUD
- **THEN** the score and enlarged next-piece preview are grouped in a dedicated region to the right of the playfield

#### Scenario: Constrained viewport is presented
- **WHEN** a side-by-side playfield and game HUD would prevent the complete game from fitting
- **THEN** the HUD adopts a compact arrangement while the playfield, score, preview, state, and controls remain visible and usable without page scrolling

#### Scenario: Viewport changes
- **WHEN** the game container changes size or device pixel ratio
- **THEN** the complete playfield, score, next-piece preview, state, and controls remain usable and the Canvas backing resolution matches its displayed size

#### Scenario: Controls and state are inspected semantically
- **WHEN** a user or assistive technology inspects the active game
- **THEN** the game name, score, next-piece identity, current playing, paused, clearing, or game-over state, and every available control have readable labels
