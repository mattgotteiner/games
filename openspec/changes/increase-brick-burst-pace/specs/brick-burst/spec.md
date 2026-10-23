## MODIFIED Requirements

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

