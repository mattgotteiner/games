# Brick Burst Specification

## Purpose
Provide the catalog's second game: a deterministic brick breaker with
phone-friendly steering, readable Classic presentation, and offline play.

## Requirements

### Requirement: Catalog launch and browser return
The catalog SHALL present Brick Burst as a playable game after Block Drop, with the kicker `Arcade`, a one-sentence description, and a `Play Brick Burst` control. The catalog count SHALL read `2 games`. Brick Burst SHALL NOT present an in-game catalog button. When Brick Burst is launched from the catalog, browser Back SHALL return to the catalog and destroy the active session.

#### Scenario: Launch Brick Burst
- **WHEN** the user activates `Play Brick Burst`
- **THEN** the catalog is replaced by a new Brick Burst session that is waiting to serve

#### Scenario: Return through browser history
- **WHEN** the user uses browser Back after launching Brick Burst from the catalog
- **THEN** the session is destroyed and the catalog lists both games as available

### Requirement: Deterministic brick-breaker rules
Brick Burst SHALL simulate a fixed playfield of 384 by 576 logical units. The playfield SHALL have one paddle, one ball, and a brick grid of 12 columns by 8 rows. Each brick SHALL be 32 by 16 units, and the grid's top edge SHALL be at y = 64. The simulation SHALL advance in fixed steps of 1/240 second, independent of the display frame rate. Given the same seed, difficulty, and sequence of timed inputs, the rules SHALL produce identical states. The seed SHALL be used only to choose serve angles.

#### Scenario: New game starts
- **WHEN** a Brick Burst session starts
- **THEN** level 1's layout is shown, the score is zero, three lives remain, and the ball rests on the center of the paddle, waiting to serve

#### Scenario: Replay identical inputs
- **WHEN** two games start with the same seed and difficulty and receive the same inputs at the same simulation steps
- **THEN** their resulting states are identical

#### Scenario: Frame rate varies
- **WHEN** the same elapsed time is delivered as 60 Hz frames in one session and 120 Hz frames in another, with the same inputs at the same simulation steps
- **THEN** both sessions reach the same state

### Requirement: Serving
While the game is serving, the ball SHALL rest on the paddle's center and move with it. Serving SHALL launch the ball upward at an angle from vertical drawn from the seeded generator: 8° to 30°, to the left or right. While the game is serving, a dotted guide SHALL show the launch direction. Serve SHALL be available from a tap on the playfield, a mouse click on the playfield, Space, ↑, and the visible Serve control.

#### Scenario: Ball is served
- **WHEN** the user serves while the game is serving
- **THEN** the ball leaves the paddle in the direction the guide showed, and the guide disappears

#### Scenario: Serve input during a rally
- **WHEN** serve input arrives while the ball is already in play
- **THEN** the game state is unchanged

### Requirement: Ball physics and bounces
The ball SHALL reflect off the left, right, and top walls. When the moving-down ball reaches the paddle's top surface, it SHALL bounce upward. Its new angle from vertical SHALL be proportional to where it hit, measured from the paddle center: from 0° at the center to 60° at either end, leaning toward the side it hit. The ball SHALL NOT bounce off the paddle once its center is below the paddle's top surface. When the ball hits a brick, it SHALL reflect on the axis where the overlap is smallest. At most one brick SHALL be hit per simulation step. When several bricks are candidates, the hit SHALL go to the brick whose center is closest to the ball. Exact ties SHALL go to the lower row index, then the lower column index; this is the first candidate in row-major order. The ball's path SHALL never be closer than 30° to horizontal. The ball SHALL NOT pass through a brick or the paddle at any reachable speed.

#### Scenario: Ball hits the paddle center
- **WHEN** a falling ball hits the middle of the paddle
- **THEN** it leaves straight up

#### Scenario: Ball hits the paddle edge
- **WHEN** a falling ball hits the paddle at its right end
- **THEN** it leaves up and to the right at 60° from vertical

#### Scenario: Ball reaches maximum speed
- **WHEN** the ball travels at the highest speed reachable on Hard in a repeated level
- **THEN** it still collides with every brick and paddle edge it crosses

#### Scenario: Ball passes the paddle
- **WHEN** the ball's top edge passes the bottom of the playfield
- **THEN** the ball is lost

#### Scenario: Tie between horizontally adjacent bricks
- **WHEN** the ball overlaps two bricks in the same row, and its center is the same distance from both brick centers (for example, exactly on their shared seam)
- **THEN** the brick with the lower column index is hit, and the other brick is unchanged

#### Scenario: Tie between vertically adjacent bricks
- **WHEN** the ball overlaps two bricks in the same column, and its center is the same distance from both brick centers
- **THEN** the brick with the lower row index is hit, and the other brick is unchanged

### Requirement: Ball speed
The ball SHALL start each serve at its level speed. Level speed SHALL be 390 units per second, times the difficulty speed, times `min(1.4, 1 + 0.06 × (level − 1))`. During a rally, every 4th brick hit SHALL raise the speed by 4%. Both velocity components SHALL be rescaled by the same factor when speed increases. Each brick hit SHALL count, including the first hit on a tough brick. The speed SHALL NOT exceed 1.6 times the level speed. The speed SHALL return to the level speed after a ball is lost.

#### Scenario: Speed ramps during a rally
- **WHEN** the ball hits its 4th brick since it was served
- **THEN** its speed is 4% higher and its direction is unchanged

#### Scenario: Ball is lost after speeding up
- **WHEN** a ball is lost and the next ball is served
- **THEN** the new ball moves at the level speed

#### Scenario: Fresh level 1 serves
- **WHEN** a new ball is served at level 1 on Easy, Medium, or Hard
- **THEN** its speed is respectively 292.5, 390, or 487.5 units per second

#### Scenario: Acceleration boundaries
- **WHEN** a level 1 Medium rally reaches hits 3, 4, 7, and 8
- **THEN** its speeds are respectively 390, 405.6, 405.6, and 421.824 units per second, within floating-point tolerance

#### Scenario: A tough brick takes its first hit
- **WHEN** an undamaged tough brick receives the fourth brick hit of a rally
- **THEN** the hit damages the brick and raises the ball's speed by 4%, subject to the rally cap

#### Scenario: Rally reaches its cap
- **WHEN** a level 1 Medium rally reaches its 48th brick hit
- **THEN** its speed reaches 624 units per second and later hits do not exceed that speed

#### Scenario: Maximum reachable speed
- **WHEN** a Hard rally at level 8 or higher reaches its speed cap
- **THEN** speed is at most 1092 units per second, and collision and minimum-angle requirements still hold

#### Scenario: Difficulty changes during a rally
- **WHEN** the player changes Difficulty while paused and resumes the existing rally
- **THEN** its current ball speed, acceleration cap, and scoring multiplier stay tied to the served difficulty, and the next serve uses the newly selected difficulty

### Requirement: Bricks and levels
Levels 1 to 5 SHALL use the layouts defined in `design.md` §3. After level 5, the layouts SHALL repeat in order while the level number keeps increasing. A layout SHALL contain only normal bricks, tough bricks, and empty cells. A normal brick SHALL break on its first hit. A tough brick SHALL show visible damage that does not depend on color after its first hit, and SHALL break on its second hit. A level SHALL be cleared when no bricks remain. The next level SHALL then start serving with the same score and lives.

#### Scenario: Normal brick is hit
- **WHEN** the ball hits a normal brick
- **THEN** the brick is removed and the ball reflects

#### Scenario: Tough brick is hit twice
- **WHEN** the ball hits an undamaged tough brick and later hits it again
- **THEN** the first hit leaves it in place and visibly cracked, and the second hit removes it

#### Scenario: Last brick is broken
- **WHEN** the final brick of a layout breaks
- **THEN** the level-clear feedback plays, then the next layout appears with the ball resting on the paddle

#### Scenario: Layouts repeat
- **WHEN** level 5 is cleared
- **THEN** level 6 uses level 1's layout at level 6's speed

### Requirement: Paddle steering
The paddle SHALL be 64 units wide and 10 units tall. Its top surface SHALL be at y = 536, and it SHALL stay inside the playfield. Steering input SHALL move it at 540 units per second while Left or Right is held. A touch or pen drag that begins on the non-interactive play area, including the playfield, surrounding padding, layout gaps, or control bar gaps, SHALL move the paddle by the same horizontal distance as the finger, at 1:1 on screen. Gameplay gestures SHALL suppress browser panning, rubber-band overscroll, text selection, and native board dragging. The difficulty slider SHALL remain usable, and Help content SHALL remain scrollable. A mouse pointer moving over the playfield SHALL center the paddle under the pointer. Steering SHALL work in the serving and playing states. Steering SHALL have no effect while the game is paused, during level-clear or ball-lost feedback, or after game over.

#### Scenario: Thumb drag steers
- **WHEN** the user drags a finger 50 CSS pixels to the right, starting anywhere on the playfield
- **THEN** the paddle moves right by 50 CSS pixels on screen, stopping at the wall

#### Scenario: Drag does not need to start on the paddle
- **WHEN** the user drags from a point well above or beside the paddle
- **THEN** the paddle moves by the drag distance and does not jump to the finger

#### Scenario: Browser does not grab a gameplay drag
- **WHEN** the user drags horizontally or diagonally from the playfield, its surrounding padding, or a non-interactive layout gap
- **THEN** the paddle follows the horizontal drag distance while the page and board stay fixed, without native dragging or text selection

#### Scenario: Native controls remain usable
- **WHEN** the user drags the paused difficulty slider or swipes through Help on a small phone
- **THEN** the difficulty changes or Help content scrolls, without moving the underlying page

#### Scenario: Keyboard or button steering
- **WHEN** the user holds ← or A, → or D, or the visible Left or Right control
- **THEN** the paddle moves continuously in that direction until release, and holding both directions at once stops it

#### Scenario: Tap versus drag
- **WHEN** a touch on the playfield ends within 300 milliseconds and moves less than 10 CSS pixels while the game is serving
- **THEN** the ball is served, and the paddle does not move

#### Scenario: Held steering uses the faster pace
- **WHEN** Left or Right is held for 100 milliseconds without reaching a wall
- **THEN** the paddle moves 54 logical units in that direction

#### Scenario: Held steering continues after a ball-loss freeze
- **WHEN** the user holds ←, A, →, D, or a visible Left or Right control while a ball is lost, and keeps holding it until the game returns to serving
- **THEN** the paddle starts moving in that direction as soon as serving begins, without a release and second press

#### Scenario: Held steering continues after a level-clear freeze
- **WHEN** the user holds a steering key or control through level-clear feedback
- **THEN** the paddle moves in that direction as soon as the next level starts serving

#### Scenario: Steering pressed during a freeze
- **WHEN** the user presses and holds a steering key or control during ball-loss or level-clear feedback, or while paused, and is still holding it when play resumes or serving begins
- **THEN** the paddle moves in that direction from the first serving or playing step, and stops when the input is released

#### Scenario: Keyboard or assistive activation nudges
- **WHEN** Left or Right is activated without a pointer hold
- **THEN** the paddle moves one 24-unit step in that direction

### Requirement: Lives, ball loss, and game over
A game SHALL start with three lives. When the ball is lost, one life SHALL be removed. Ball-lost feedback SHALL then play for 400 milliseconds, and the simulation SHALL NOT advance during that time. If lives remain, the game SHALL then return to serving. When the last life is lost, the game SHALL end. A game-over card SHALL show the final score and the best score, mark a new best when there is one, and focus `Play again`. The best score SHALL be saved on the device under `games.brick-burst.best-score`.

#### Scenario: Ball is lost with lives remaining
- **WHEN** the ball is lost with two or three lives remaining
- **THEN** one life is removed, the feedback plays, and the ball rests on the paddle waiting to serve

#### Scenario: Last ball is lost
- **WHEN** the ball is lost with one life remaining
- **THEN** the game-over card shows the final and best scores and focuses `Play again`

#### Scenario: Play again
- **WHEN** the user activates `Play again`
- **THEN** a fresh game starts at level 1 with score zero and three lives

#### Scenario: Loss feedback duration
- **WHEN** a ball is lost with lives remaining and the game is not paused
- **THEN** the ball, paddle, and bricks remain frozen for 96 simulation steps (400 milliseconds), and the game returns to serving at the end of that interval

#### Scenario: Loss feedback is paused
- **WHEN** the user pauses during ball-loss feedback
- **THEN** its remaining timer is frozen, and resuming completes only that remaining feedback time before serving

### Requirement: Deterministic score
Breaking a brick SHALL award points based on its row: rows 0–1 award 40, rows 2–3 award 30, rows 4–5 award 20, and rows 6–7 award 10. The first hit on a tough brick SHALL award 10, and breaking it SHALL award twice its row points. Clearing a level SHALL award 500 times the cleared level number. Every award SHALL be multiplied by the difficulty multiplier and rounded to the nearest integer before it is added.

#### Scenario: Brick broken on Medium
- **WHEN** a normal brick in row 2 breaks on Medium
- **THEN** the score increases by 30

#### Scenario: Tough brick broken on Hard
- **WHEN** a tough brick in row 0 breaks on Hard
- **THEN** the score increases by 100 (2 × 40 × 1.25)

#### Scenario: Level cleared on Easy
- **WHEN** level 3 is cleared on Easy
- **THEN** the score increases by 1125 (500 × 3 × 0.75)

### Requirement: Difficulty selection
The pause menu SHALL include a Difficulty control with Easy, Medium, and Hard options. Medium SHALL be the default. Easy SHALL set the speed and score multipliers to 0.75, Medium to 1, and Hard to 1.25. Changing difficulty SHALL take effect at the next serve and SHALL NOT change the current ball's speed. The HUD SHALL show the selected difficulty and its multiplier. The choice SHALL be saved under `games.brick-burst.difficulty` and restored on later launches. Missing, invalid, or unreadable values SHALL use Medium.

#### Scenario: Difficulty changes while paused mid-rally
- **WHEN** the user changes Medium to Hard while paused during a rally, then resumes
- **THEN** the ball keeps its current speed, and the next serve uses Hard speed

#### Scenario: Difficulty is restored
- **WHEN** the user selects Easy and opens Brick Burst again later on the same device
- **THEN** the game opens on Easy

### Requirement: Pause, resume, and restart
The user SHALL be able to pause and resume an active game without changing the ball, paddle, bricks, score, lives, or level. While the game is paused, no simulation time SHALL accumulate. The game SHALL pause automatically when the document becomes hidden. The pause card SHALL show `Resume`, `Restart`, `Help`, and Difficulty, and `Resume` SHALL receive focus. Restart SHALL start a fresh game at level 1.

#### Scenario: User pauses mid-rally
- **WHEN** the user pauses while the ball is moving
- **THEN** the ball, paddle, and bricks freeze, and the pause card opens with `Resume` focused

#### Scenario: Time passes while paused
- **WHEN** animation frames continue while the game is paused
- **THEN** the state is unchanged and resuming does not jump forward in time

#### Scenario: Tab is hidden
- **WHEN** the document becomes hidden during play
- **THEN** the game is paused when the user returns

### Requirement: Keyboard and touch play
Every gameplay action SHALL be available through both visible touch controls and the keyboard. Both SHALL produce the same logical actions. The control bar SHALL contain Left, Serve, and Right, in that visual and reading order. On portrait phones, each target SHALL be at least 56 by 56 CSS pixels. Left and Right SHALL act when pressed and stop when released or cancelled. Serve SHALL be unavailable, both visibly and semantically, whenever no ball is waiting to serve. Pause SHALL be a session action in the header, separate from the gameplay controls. The documented keys SHALL be ← and → or A and D to steer, Space or ↑ to serve, P to pause and resume, and R to restart.

#### Scenario: Control meaning is inspected
- **WHEN** a user or assistive technology inspects a control
- **THEN** its action is named in text, such as `Move paddle left`, `Serve ball`, `Move paddle right`, or `Pause`

#### Scenario: Control activated without a pointer
- **WHEN** Left or Right is activated by keyboard or assistive technology
- **THEN** the paddle moves one step of 24 units in that direction

### Requirement: Touch gestures do not move the page
While Brick Burst is open, one-finger drags and double-taps that begin on the playfield, its surrounding padding, layout gaps, HUD, control bar, or overlays SHALL NOT pan or zoom the page. Pinch zoom SHALL remain available over the header. Native difficulty controls SHALL remain usable, and Help SHALL scroll internally.

#### Scenario: Fast steering drag
- **WHEN** the user drags quickly back and forth across the playfield or surrounding non-interactive play area
- **THEN** only the paddle moves, and the page does not scroll, bounce, select text, start a native drag, or zoom

### Requirement: Brick Burst visual presentation
Brick Burst SHALL follow the active Classic art direction. That includes the Classic palette, the bevelled brick recipe, the tough-brick rivets and crack, the paddle and ball, the serve guide, and the brick-pop, ball-lost, and level-clear effects. Effects SHALL be cosmetic. They SHALL be deterministic for the same event, SHALL stay inside the playfield, and SHALL NOT use `Math.random`. Brick-pop effects SHALL NOT pause the simulation. Level-clear feedback SHALL last 650 milliseconds, and the simulation SHALL NOT advance during it. When reduced motion is preferred, Brick Burst SHALL draw no fragments, ball trail, or light sweep. Bricks SHALL disappear immediately and the tough-brick crack SHALL still show.

#### Scenario: Brick breaks
- **WHEN** a brick breaks and reduced motion is not preferred
- **THEN** it flashes and splits into fragments that fade within 240 milliseconds while the ball keeps moving

#### Scenario: Same event drawn twice
- **WHEN** the same brick-pop event is drawn at the same progress twice
- **THEN** the drawing is identical

#### Scenario: Reduced motion
- **WHEN** reduced motion is preferred and a brick breaks or a level clears
- **THEN** the brick vanishes without fragments, and the level callout appears without the sweep

#### Scenario: Synchronized level-clear feedback
- **WHEN** a level is cleared and the game is not paused
- **THEN** the Canvas feedback and DOM callout use a 650-millisecond interval, the rules wait 156 steps before the next level starts serving, and the next ball still requires an explicit serve

#### Scenario: Level-clear feedback is paused
- **WHEN** the user pauses during level-clear feedback
- **THEN** the remaining rules timer and Canvas effect progress freeze, and paused wall-clock time does not advance the next level

#### Scenario: Shorter feedback with reduced motion
- **WHEN** reduced motion is preferred during ball-loss or level-clear feedback
- **THEN** the feedback lasts respectively 400 or 650 milliseconds, the level callout remains readable, and the existing motion omissions still apply

### Requirement: Responsive and accessible presentation
The playfield SHALL keep its 2:3 shape and render sharply at the device pixel ratio. It SHALL take the largest share of the viewport. At 390 by 844 CSS pixels in portrait, the score, level, lives, and state SHALL share one compact strip above the playfield. The playfield SHALL be at least 520 CSS pixels tall, and the page SHALL NOT scroll. When there is room, the HUD SHALL sit to the right of the playfield. No supported viewport SHALL require page scrolling. The score, level, lives, game state, and controls SHALL have readable text or accessible names that do not depend on Canvas pixels or color. Text SHALL have at least 4.5:1 contrast against its surface. Focus indicators and control boundaries SHALL have at least 3:1 contrast. The canvas backing store SHALL be resized only when the container size or effective device pixel ratio changes, never on frames where neither has changed.

#### Scenario: Portrait phone
- **WHEN** the game is shown at 390 by 844 CSS pixels
- **THEN** the HUD strip, a playfield at least 520 CSS pixels tall, and the control bar are visible without scrolling

#### Scenario: Lives are inspected
- **WHEN** assistive technology reads the HUD
- **THEN** the lives are read as text such as `2 lives`, not only shown as icons

#### Scenario: Viewport changes
- **WHEN** the container size or device pixel ratio changes
- **THEN** the canvas backing size matches its displayed size, and the paddle stays in the same logical position

#### Scenario: Browser zoomed below 100%
- **WHEN** the device pixel ratio is below 1 (for example 0.9 at 90% browser zoom) and the container size does not change
- **THEN** the canvas is resized at most once, not on every animation frame

### Requirement: Concise live announcements
Brick Burst SHALL announce serve readiness at the start of each level, a lost ball with the remaining lives, a level clear with the new score, pause, resume, and game over through one polite status region. It SHALL NOT announce individual brick hits or score changes.

#### Scenario: Ball is lost
- **WHEN** the ball is lost with lives remaining
- **THEN** one announcement states the ball was lost and how many lives remain

#### Scenario: Bricks break
- **WHEN** bricks break during a rally
- **THEN** no announcement is made

### Requirement: Help
The pause menu SHALL open a Help dialog. It SHALL begin with short `How to play` guidance, then list scoring and controls. It SHALL scroll internally on short viewports and return focus to `Help` when it closes.

#### Scenario: Help is opened
- **WHEN** the user activates `Help` from the pause card
- **THEN** the dialog shows how to play, scoring, and controls, and closing it returns focus to `Help`

### Requirement: Optional haptic feedback
Where vibration is supported and reduced motion is not preferred, Brick Burst SHALL request a short vibration when a brick breaks, a longer one when a ball is lost, and a short pattern when a level clears. Otherwise, it SHALL play the same without vibration.

#### Scenario: Vibration unavailable
- **WHEN** a brick breaks on a device without vibration support
- **THEN** no vibration is requested and gameplay is unaffected

### Requirement: Session resource cleanup and offline play
Leaving Brick Burst SHALL stop its simulation and rendering. It SHALL also remove its keyboard, pointer, visibility, and resize listeners, and restore the page background and browser theme color. Brick Burst SHALL load no network resources at runtime. Once the production application has loaded online, Brick Burst SHALL launch and play offline.

#### Scenario: Session is destroyed
- **WHEN** browser Back returns to the catalog
- **THEN** no Brick Burst animation frame, timer, listener, or observer remains, and the catalog's page colors are restored

#### Scenario: Launch offline
- **WHEN** the installed application is offline and the user opens Brick Burst
- **THEN** the game renders and accepts input without a network request
