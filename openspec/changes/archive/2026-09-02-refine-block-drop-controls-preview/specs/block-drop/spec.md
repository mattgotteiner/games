## MODIFIED Requirements

### Requirement: Next-piece preview
Block Drop SHALL identify and visualize the exact tetromino that will become active after the current piece locks. The preview SHALL use the piece's initial orientation, SHALL remain consistent with seeded piece generation, and SHALL center the occupied-cell bounds of every supported tetromino horizontally and vertically within a preview frame large enough to show the four-cell I piece without clipping or changing cell scale.

#### Scenario: Game starts
- **WHEN** a new game creates its first active piece
- **THEN** the following piece is immediately shown in the next-piece preview

#### Scenario: Active piece locks
- **WHEN** the active piece locks and the previewed piece enters play
- **THEN** the preview updates to the subsequent generated piece

#### Scenario: Any supported piece is previewed
- **WHEN** the next piece is any of the seven supported tetrominoes
- **THEN** its occupied-cell bounds are centered on the same horizontal and vertical midpoint without clipping

#### Scenario: Preview is inspected semantically
- **WHEN** a user or assistive technology inspects the next-piece preview
- **THEN** both a shape visualization and a readable tetromino identifier are available

### Requirement: Clear control hierarchy and feedback
Block Drop SHALL present catalog, navigation, movement, drop, pause, and restart controls with consistent touch-friendly sizing and a visual hierarchy that distinguishes primary gameplay actions from secondary session actions. The movement group SHALL present left, right, rotate, and soft drop in that visual and reading order, with left and right adjacent and rotate immediately to the right of right. Every control SHALL expose visible keyboard focus and appropriate hover, pressed, and disabled feedback without relying on color alone.

#### Scenario: User scans the gameplay controls
- **WHEN** the Block Drop play screen is presented
- **THEN** related movement and drop controls are visually grouped and pause, restart, and catalog actions are distinguishable from moment-to-moment gameplay actions

#### Scenario: User scans movement controls
- **WHEN** the movement control group is presented at any supported viewport
- **THEN** left and right are adjacent, rotate immediately follows right, and soft drop follows rotate in visual and reading order

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
