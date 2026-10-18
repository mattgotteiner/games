## MODIFIED Requirements

### Requirement: Keyboard and touch play
Every gameplay action SHALL be available through visible touch controls and through keyboard controls, with both input methods producing the same logical actions. The visible controls SHALL use familiar directional and action labels, and the pause control SHALL become a resume control while paused. Pointer and touch activation of a gameplay control SHALL apply its action when the control is pressed rather than when it is released. Holding the left, right, or soft-drop control SHALL repeat its action after an initial delay of 170 milliseconds and then every 50 milliseconds until the pointer is released or cancelled, or the game leaves active play. Rotation and hard drop SHALL NOT repeat while held. Keyboard and assistive-technology activation of a visible control SHALL apply its action exactly once.

#### Scenario: Touch action
- **WHEN** the user presses a visible movement, rotation, soft-drop, or hard-drop control
- **THEN** the corresponding logical action is applied immediately on press

#### Scenario: Short tap on a repeatable control
- **WHEN** the user presses and releases the left, right, or soft-drop control within 170 milliseconds
- **THEN** the corresponding logical action is applied exactly once

#### Scenario: Holding a repeatable control
- **WHEN** the user holds the left, right, or soft-drop control during active play
- **THEN** the action is applied on press, again after 170 milliseconds, and then every 50 milliseconds until release

#### Scenario: Holding a non-repeatable control
- **WHEN** the user holds the rotate or hard-drop control
- **THEN** the action is applied once

#### Scenario: Play stops during a hold
- **WHEN** the game pauses, begins line-clear feedback, or reaches game over while a control is held
- **THEN** repetition stops and does not resume until the control is pressed again

#### Scenario: Two controls are used together
- **WHEN** the user holds one movement control and presses another gameplay control
- **THEN** both controls apply their actions independently

#### Scenario: Keyboard action
- **WHEN** the active game receives the documented key for a movement, rotation, soft-drop, hard-drop, pause/resume, or restart action
- **THEN** the same logical action as the corresponding visible control is applied

#### Scenario: Control activated without a pointer
- **WHEN** a visible control is activated by keyboard or assistive technology
- **THEN** its logical action is applied exactly once

#### Scenario: Control meaning is inspected
- **WHEN** a user or assistive technology inspects a gameplay control
- **THEN** its movement, drop, pause/resume, or restart action is unambiguous without requiring interpretation of an icon alone

### Requirement: Clear control hierarchy and feedback
Block Drop SHALL present catalog, navigation, movement, drop, pause, and restart controls with consistent touch-friendly sizing and a visual hierarchy that distinguishes primary gameplay actions from secondary session actions. The gameplay controls SHALL be presented in the visual and reading order left, right, soft drop, rotate, hard drop, with left and right adjacent. On portrait phone viewports, left, right, and soft drop SHALL form a cluster at the left edge and rotate and hard drop SHALL form a cluster at the right edge, with each gameplay target at least 56 by 56 CSS pixels. Every control SHALL expose visible keyboard focus and appropriate hover, pressed, and disabled feedback without relying on color alone.

#### Scenario: User scans the gameplay controls
- **WHEN** the Block Drop play screen is presented
- **THEN** related movement and drop controls are visually grouped and pause, restart, and catalog actions are distinguishable from moment-to-moment gameplay actions

#### Scenario: User scans movement controls
- **WHEN** the gameplay controls are presented at any supported viewport
- **THEN** left and right are adjacent and the controls follow the order left, right, soft drop, rotate, hard drop in both visual and reading order

#### Scenario: User plays on a portrait phone
- **WHEN** the gameplay controls are presented on a portrait phone viewport
- **THEN** left, right, and soft drop sit in a cluster at the left edge, rotate and hard drop sit in a cluster at the right edge, and each gameplay target is at least 56 by 56 CSS pixels

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

## ADDED Requirements

### Requirement: Optional haptic feedback
Where the device supports vibration and the user has not requested reduced motion, Block Drop SHALL give a brief vibration when a piece locks and a slightly longer one when lines are cleared. Where vibration is unsupported or reduced motion is preferred, gameplay SHALL behave identically without it.

#### Scenario: Piece locks on a supporting device
- **WHEN** a piece locks on a device that supports vibration and reduced motion is not preferred
- **THEN** a brief vibration is requested

#### Scenario: Vibration is unavailable or unwanted
- **WHEN** a piece locks on a device without vibration support or with reduced motion preferred
- **THEN** no vibration is requested and gameplay is unaffected

### Requirement: Touch drags do not pan the game page
While Block Drop is open, one-finger touch drags that begin anywhere within the game screen SHALL NOT pan the browser page. Pinch zoom SHALL remain available.

#### Scenario: User drags a game element
- **WHEN** the user drags on the heading, board, game information, preview, or a control
- **THEN** the browser page remains in place

#### Scenario: User pinches to zoom
- **WHEN** the user pinches on the game screen
- **THEN** browser pinch zoom remains available
