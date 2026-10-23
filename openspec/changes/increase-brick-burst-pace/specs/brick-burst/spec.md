## MODIFIED Requirements

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


### Requirement: Paddle steering
The paddle SHALL be 64 units wide and 10 units tall. Its top surface SHALL be at y = 536, and it SHALL stay inside the playfield. Steering input SHALL move it at 540 units per second while Left or Right is held. A touch or pen drag that begins on the playfield or the control bar SHALL move the paddle by the same horizontal distance as the finger, at 1:1 on screen. A mouse pointer moving over the playfield SHALL center the paddle under the pointer. Steering SHALL work in the serving and playing states. Steering SHALL have no effect while the game is paused, during level-clear or ball-lost feedback, or after game over.

#### Scenario: Thumb drag steers
- **WHEN** the user drags a finger 50 CSS pixels to the right, starting anywhere on the playfield
- **THEN** the paddle moves right by 50 CSS pixels on screen, stopping at the wall

#### Scenario: Drag does not need to start on the paddle
- **WHEN** the user drags from a point well above or beside the paddle
- **THEN** the paddle moves by the drag distance and does not jump to the finger

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

