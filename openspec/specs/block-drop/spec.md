# Block Drop Specification

## Purpose

Provide the catalog's first complete game: an originally presented,
deterministic falling-block puzzle that is playable with touch or keyboard and
remains available from the installed offline application.

## Requirements

### Requirement: Catalog launch and return
The catalog SHALL present Block Drop as one playable game and SHALL let the
user return from an active game to the catalog.

#### Scenario: Launch Block Drop
- **WHEN** the user activates the Block Drop play control
- **THEN** the catalog is replaced by a new playable Block Drop session

#### Scenario: Return to the catalog
- **WHEN** the user activates the return control from Block Drop
- **THEN** the active session is destroyed and the catalog presents Block Drop as available to play again

### Requirement: Deterministic falling-block rules
Block Drop SHALL use a ten-column by twenty-row visible playfield, the seven
standard four-cell tetromino shapes, and seeded shuffled groups containing one
of each shape. Given the same seed and logical actions, the rules SHALL produce
the same states.

#### Scenario: New game starts
- **WHEN** a Block Drop session starts
- **THEN** the visible playfield is empty and one valid piece is active near its top

#### Scenario: Complete shuffled group
- **WHEN** seven consecutive pieces are drawn from a newly shuffled group
- **THEN** the group contains each supported tetromino shape exactly once

#### Scenario: Replay identical actions
- **WHEN** two games start with the same seed and receive the same logical actions
- **THEN** their resulting game states are identical

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

### Requirement: Deterministic score
Block Drop SHALL start each new game at zero points. The selected difficulty's
speed multiplier SHALL scale every manual score award: soft drop SHALL award
one base point per row, hard drop SHALL award two base points per row, and line
clears SHALL award 100, 300, 500, or 800 base points for one, two, three, or
four rows respectively, multiplied by the level before the clear. Automatic
descent SHALL NOT award drop points. Score totals and saved best scores SHALL
preserve half-point increments without rounding, and existing integer best
scores SHALL remain valid.

#### Scenario: New game starts
- **WHEN** a new Block Drop game starts
- **THEN** its score is zero

#### Scenario: Player soft drops
- **WHEN** soft drop successfully advances the active piece by one row
- **THEN** the score increases by one base point multiplied by the selected difficulty speed

#### Scenario: Player hard drops
- **WHEN** hard drop advances the active piece by one or more rows before locking
- **THEN** the score increases by two base points for each row advanced, multiplied by the selected difficulty speed

#### Scenario: Automatic descent advances
- **WHEN** gravity advances the active piece
- **THEN** the score does not change

#### Scenario: Rows clear together
- **WHEN** a lock clears one, two, three, or four rows simultaneously
- **THEN** the score additionally increases by 100, 300, 500, or 800 base points respectively, multiplied by the level before the clear and the selected difficulty speed

#### Scenario: Clear reaches a new level
- **WHEN** a lock clears lines that move the game from one level to the next
- **THEN** the line-clear points use the earlier level's multiplier

#### Scenario: Game ends
- **WHEN** the game reaches game over
- **THEN** the final score remains displayed until the user restarts or leaves

#### Scenario: User restarts
- **WHEN** the user starts a fresh game
- **THEN** the score resets to zero

#### Scenario: Fractional score is saved
- **WHEN** a final score contains a half point
- **THEN** the displayed score and saved best score retain the half point without rounding

### Requirement: Visible scoring explanation
Block Drop SHALL make a scoring guide available on demand from a labelled help
control that is always visible in the game header. The guide SHALL open in a
modal dialog that states the base values for soft drops and hard drops, that
automatic gravity earns no points, and that line clears use the level before
the clear. The guide SHALL explain the Easy 0.5×, Medium 1×, and Hard 1.5×
difficulty score multipliers, the combined line-clear formula, and that the
level rises every ten lines and increases the falling speed. The guide SHALL
also list the keyboard controls. The displayed values SHALL remain consistent
with the deterministic score calculation. Opening the guide during active play
SHALL pause the game, and closing the guide SHALL leave the game paused and
return focus to the help control.

#### Scenario: Player inspects the score
- **WHEN** the user activates the help control
- **THEN** a dialog identifies every action that can change the score, the number of points it awards, the level multiplier, and the keyboard controls

#### Scenario: Guide opens during active play
- **WHEN** the user opens the scoring guide while the game is playing
- **THEN** the game becomes paused before the guide is presented

#### Scenario: Player closes the guide
- **WHEN** the user closes the scoring guide
- **THEN** the game remains in its paused or game-over state and focus returns to the help control

#### Scenario: Player presses soft drop
- **WHEN** a successful soft drop increases the score and the user opens the scoring guide
- **THEN** the guide explains the base soft-drop points and the selected difficulty multiplier

#### Scenario: Automatic gravity advances
- **WHEN** gravity moves a piece downward without changing the score and the user opens the scoring guide
- **THEN** the guide explains that automatic gravity earns no points

#### Scenario: Constrained viewport is presented
- **WHEN** the scoring guide is opened on a portrait or short-landscape phone viewport
- **THEN** the complete guide is readable within the dialog without clipping and without forcing the page to scroll

#### Scenario: Scoring guide is inspected semantically
- **WHEN** a user or assistive technology inspects the scoring guide
- **THEN** the dialog has a readable name and associates each scoring action with its point value

### Requirement: Level progression
Block Drop SHALL count the lines cleared in the current game and SHALL derive
the level as the number of lines cleared divided by ten, rounded down, plus one.
At Medium difficulty, the automatic descent interval SHALL be the greater of
80 milliseconds and 700 milliseconds multiplied by 0.85 raised to the power of
one less than the level, rounded to the nearest millisecond. The selected
difficulty SHALL scale that interval as defined by the Difficulty selection
requirement. Lines and level SHALL be part of the deterministic game state,
SHALL reset on restart, and SHALL be shown with readable labels in the game HUD
at every supported viewport. A level change SHALL be announced and SHALL
briefly highlight the displayed level unless reduced motion is preferred.

#### Scenario: New game starts
- **WHEN** a new Block Drop game starts
- **THEN** lines is zero, level is one, difficulty is Medium, and automatic descent occurs every 700 milliseconds

#### Scenario: Tenth line is cleared
- **WHEN** the total lines cleared reaches ten
- **THEN** the level becomes two, automatic descent occurs every 595 milliseconds, and the new level is announced

#### Scenario: High level is reached
- **WHEN** the level is high enough that the formula would fall below 80 milliseconds
- **THEN** automatic descent occurs every 80 milliseconds

#### Scenario: Replay identical actions
- **WHEN** two games start with the same seed and receive the same logical actions
- **THEN** their lines and level are identical at every step

#### Scenario: Progress is inspected
- **WHEN** a user or assistive technology inspects the game HUD
- **THEN** the current level and lines cleared are available as readable text

### Requirement: Difficulty selection
Block Drop SHALL start at the saved device difficulty, or Medium when no valid
preference exists, and SHALL provide an accessible three-position difficulty
slider in the pause menu. Easy SHALL make automatic
descent half as fast as the selected level curve, Medium SHALL use the level
curve unchanged, and Hard SHALL make it 1.5 times as fast, subject to the
80-millisecond minimum interval. The same 0.5×, 1×, or 1.5× setting SHALL
scale future manual score awards. Changing difficulty SHALL NOT change the
current score, line progression, or level. The selected difficulty and its
multiplier SHALL be visible in the game HUD while playing, paused, and at game
over. A selection SHALL remain selected after restarting and SHALL be restored
the next time Block Drop is opened on the same device. Missing, invalid, or
unavailable stored preferences SHALL use Medium without preventing play.

#### Scenario: Difficulty slider is inspected
- **WHEN** the user opens the pause menu
- **THEN** the slider exposes Easy, Medium, and Hard as its three named choices and starts at the saved difficulty, or Medium when no valid preference exists

#### Scenario: Difficulty is visible during play
- **WHEN** the game is playing, paused, or over
- **THEN** the HUD shows the selected difficulty and its speed and score multiplier

#### Scenario: Difficulty is restored on a later launch
- **WHEN** the user selects a difficulty and opens Block Drop again later on the same device
- **THEN** the game starts at the saved difficulty and shows it in the HUD

#### Scenario: Stored difficulty is invalid or unavailable
- **WHEN** the saved preference is not Easy, Medium, or Hard, or storage cannot be read
- **THEN** a new game starts at Medium and remains playable

#### Scenario: Easy is selected
- **WHEN** the user selects Easy and resumes at Level 1
- **THEN** automatic descent occurs every 1400 milliseconds

#### Scenario: Hard is selected
- **WHEN** the user selects Hard and resumes at Level 1
- **THEN** automatic descent occurs every 467 milliseconds

#### Scenario: Difficulty is changed while paused
- **WHEN** the user changes difficulty in the pause menu
- **THEN** the board, active piece, next piece, score, lines, and level stay unchanged until play resumes, and the new choice is saved for the next launch

#### Scenario: Difficulty changes future scoring
- **WHEN** the user changes difficulty while paused and then earns points
- **THEN** only future soft-drop, hard-drop, and line-clear awards use the newly selected speed multiplier

#### Scenario: Restart after choosing difficulty
- **WHEN** the user restarts during the same game session after changing difficulty
- **THEN** lines, level, and score reset while the selected difficulty remains active and saved

### Requirement: Line-clear callout
When a lock clears lines, Block Drop SHALL briefly show a callout over the
playfield with the points earned and the size of the clear. The callout SHALL
NOT be the only way this information is conveyed, SHALL NOT block input once
line-clear feedback ends, and SHALL appear without movement when reduced motion
is preferred.

#### Scenario: Lines are cleared
- **WHEN** a lock clears one or more lines
- **THEN** a callout shows the points awarded and names the clear size, then disappears shortly after the line-clear feedback ends

#### Scenario: Reduced motion is preferred
- **WHEN** reduced motion is preferred and lines are cleared
- **THEN** the callout appears and disappears without animated movement

### Requirement: Next-piece preview
Block Drop SHALL identify and visualize the exact tetromino that will become
active after the current piece locks. The preview SHALL use the piece's initial
orientation, SHALL remain consistent with seeded piece generation, and SHALL
center the occupied-cell bounds of every supported tetromino horizontally and
vertically within a preview frame large enough to show the four-cell I piece
without clipping or changing cell scale.

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

### Requirement: Game over and restart
Block Drop SHALL end the game when a newly spawned piece has no valid position
and SHALL allow the user to start a fresh game.

#### Scenario: Spawn area is obstructed
- **WHEN** the next piece cannot occupy its initial position
- **THEN** automatic descent and gameplay actions stop and the game-over state is shown

#### Scenario: Restart after game over
- **WHEN** the user activates restart from the game-over state
- **THEN** a new game starts with an empty playfield and an active piece

### Requirement: Keyboard and touch play
Every gameplay action SHALL be available through visible touch controls and
through keyboard controls, with both input methods producing the same logical
actions. The visible controls SHALL use familiar directional and action labels,
and the pause control SHALL become a resume control while paused. Pointer and
touch activation of a gameplay control SHALL apply its action when the control
is pressed rather than when it is released. Holding the left, right, or
soft-drop control SHALL repeat its action after an initial delay of 170
milliseconds and then every 50 milliseconds until the pointer is released or
cancelled, or the game leaves active play. Rotation and hard drop SHALL NOT
repeat while held. Keyboard and assistive-technology activation of a visible
control SHALL apply its action exactly once.

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
Block Drop SHALL present catalog, navigation, movement, drop, pause, and restart controls with consistent touch-friendly sizing and a visual hierarchy that distinguishes primary gameplay actions from secondary session actions. Gameplay controls SHALL follow the visual and reading order left, right, soft drop, rotate, and hard drop, with left and right adjacent. On portrait phone viewports, left, right, and soft drop SHALL form a cluster at the left edge and rotate and hard drop SHALL form a cluster at the right edge, with each target at least 56 by 56 CSS pixels. Every control SHALL expose visible keyboard focus and appropriate hover, pressed, and disabled feedback without relying on color alone.

#### Scenario: User scans the gameplay controls
- **WHEN** the Block Drop play screen is presented
- **THEN** related movement and drop controls are visually grouped and pause, restart, and catalog actions are distinguishable from moment-to-moment gameplay actions

#### Scenario: User scans movement controls
- **WHEN** the movement control group is presented at any supported viewport
- **THEN** the controls follow the order left, right, soft drop, rotate, hard drop in both visual and reading order, with left and right adjacent

#### Scenario: User plays on a portrait phone
- **WHEN** the gameplay controls are presented on a portrait phone viewport
- **THEN** left, right, and soft drop form a cluster at the left edge and rotate and hard drop form a cluster at the right edge, with each gameplay target at least 56 by 56 CSS pixels

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

### Requirement: Optional haptic feedback
Where the device supports vibration and the user has not requested reduced motion, Block Drop SHALL give a brief vibration when a piece locks and a slightly longer one when lines are cleared. Where vibration is unsupported or reduced motion is preferred, gameplay SHALL behave identically without it.

#### Scenario: Piece locks on a supporting device
- **WHEN** a piece locks on a device that supports vibration and reduced motion is not preferred
- **THEN** a brief vibration is requested

#### Scenario: Lines clear on a supporting device
- **WHEN** one or more lines clear on a device that supports vibration and reduced motion is not preferred
- **THEN** a slightly longer vibration is requested

#### Scenario: Vibration is unavailable or unwanted
- **WHEN** a piece locks on a device without vibration support or with reduced motion preferred
- **THEN** no vibration is requested and gameplay is unaffected

### Requirement: Touch drags do not pan the game page
While Block Drop is open, one-finger touch drags that begin anywhere within the game screen SHALL NOT pan the browser page. Double-tap gestures that begin anywhere within the game screen SHALL NOT zoom the browser page. Pinch zoom SHALL remain available over the playfield and other game-screen regions that are not temporarily gesture-locked. Pinch zoom SHALL be blocked when it begins over the gameplay controls while paused, after game over, or during the brief post-resume/restart gesture guard.

#### Scenario: User drags a game element
- **WHEN** the user drags on the heading, board, game information, preview, a control, or an overlay
- **THEN** the browser page remains in place

#### Scenario: User double-taps an overlay
- **WHEN** the user double-taps the pause panel or game-over card
- **THEN** the browser page does not zoom

#### Scenario: User taps a gameplay control immediately after resuming
- **WHEN** the user resumes or restarts and quickly taps a gameplay control
- **THEN** the browser page does not zoom during the transition back to play

#### Scenario: User taps an inactive gameplay control
- **WHEN** the user taps a visible gameplay control while the game is paused or over
- **THEN** the browser page does not zoom

#### Scenario: User pinches over an unlocked game region
- **WHEN** the user pinches over the playfield or another game-screen region that is not temporarily gesture-locked
- **THEN** browser pinch zoom remains available

#### Scenario: User pinches over temporarily locked gameplay controls
- **WHEN** the user pinches over the gameplay controls while paused, after game over, or during the brief post-resume/restart gesture guard
- **THEN** browser pinch zoom is blocked in that control region

### Requirement: Session action placement
Block Drop SHALL present pause/resume, help, and restart as session actions that
are visually and structurally separate from the movement, rotation, and drop
controls. No session action SHALL be adjacent to the hard-drop control. Keyboard
shortcuts for pause and restart SHALL remain available regardless of where the
visible session actions are placed.

#### Scenario: User scans the gameplay controls
- **WHEN** the Block Drop play screen is presented at any supported viewport
- **THEN** the gameplay control groups contain only movement, rotation, soft-drop, and hard-drop controls, and no session action sits beside the hard-drop control

#### Scenario: User restarts from the keyboard
- **WHEN** the user presses the documented restart key during active play
- **THEN** a fresh game starts as before

### Requirement: Concise live announcements
Block Drop SHALL announce line clears, pause, resume, and game over through a
single polite status region, and SHALL NOT announce score changes caused only by
soft-drop or hard-drop rows. The current score SHALL remain readable on demand.

#### Scenario: Player soft drops
- **WHEN** a soft drop changes the score without clearing a line
- **THEN** no live announcement is made

#### Scenario: Lines are cleared
- **WHEN** a lock clears one or more lines
- **THEN** a single announcement states the number of lines cleared and the new score

#### Scenario: Game state changes
- **WHEN** the game is paused, resumed, or reaches game over
- **THEN** a single announcement states the new state

### Requirement: Responsive and accessible presentation
Block Drop SHALL render an originally styled playfield and next-piece preview
sharply within its available phone viewport in portrait and landscape
orientations, and SHALL give the playfield the largest share of the available
space. The game header SHALL occupy a single compact row. The visible playfield
frame SHALL fit the rendered playfield rather than spanning unused width. On a
390 by 844 CSS pixel portrait viewport, the displayed playfield SHALL be at
least 540 CSS pixels tall. When sufficient horizontal space is available, a
game HUD SHALL appear to the right of the playfield with the score as its
strongest numeric element and an enlarged next-piece preview. On portrait phone
viewports, the score, game state, and next-piece preview SHALL appear in a single
compact strip between the header and the playfield. No supported viewport SHALL
require page scrolling. The score, next-piece identity, game state, clear
feedback, and controls SHALL have readable text or accessible names rather than
requiring Canvas pixels, motion, or color interpretation alone.

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

### Requirement: Session resource cleanup
Leaving Block Drop SHALL stop its simulation and rendering and remove
game-specific input and resize observation.

#### Scenario: Active game is destroyed
- **WHEN** the user returns to the catalog or the game component unmounts
- **THEN** no game animation frame, timer, keyboard handler, or resize observer remains active

### Requirement: Offline play after first load
Block Drop SHALL remain launchable and playable from the production application
after its current deployment has loaded successfully online and connectivity is
then removed.

#### Scenario: Launch the game offline
- **WHEN** the current production application has loaded online, the browser becomes offline, and the user opens Block Drop
- **THEN** the game renders and accepts gameplay input without a network error

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
