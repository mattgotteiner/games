## MODIFIED Requirements

### Requirement: Deterministic score
Block Drop SHALL start each new game at zero points. Each row advanced by soft
drop SHALL add one point multiplied by the selected difficulty speed. Each row
advanced by hard drop SHALL add two points multiplied by the selected
difficulty speed. When a lock clears one, two, three, or four rows together,
the score SHALL increase by 100, 300, 500, or 800 points respectively,
multiplied by the level before the clear and by the selected difficulty speed.
Automatic descent SHALL NOT award points. Scores SHALL preserve half-point
values rather than rounding them.

#### Scenario: Soft drop at Easy
- **WHEN** soft drop advances the active piece by one row at Easy
- **THEN** the score increases by 0.5 points

#### Scenario: Hard drop at Hard
- **WHEN** hard drop advances the active piece by one row at Hard
- **THEN** the score increases by 3 points

#### Scenario: Single clear at Hard on Level 2
- **WHEN** a lock clears one row at Hard on Level 2
- **THEN** the score increases by 300 points

#### Scenario: Clear reaches a new level
- **WHEN** a lock clears lines that move the game from one level to the next
- **THEN** line-clear points use the earlier level's multiplier and the selected difficulty multiplier

#### Scenario: Difficulty changes during a run
- **WHEN** the user changes difficulty while paused
- **THEN** the existing score remains unchanged and future score awards use the new multiplier

### Requirement: Visible scoring explanation
The scoring guide SHALL explain the difficulty multiplier for soft-drop,
hard-drop, and line-clear points. It SHALL explain that line-clear points also
use the level before the clear and that automatic descent awards no points.

#### Scenario: Player inspects scoring at each difficulty
- **WHEN** the user opens the scoring guide
- **THEN** the guide states the Easy 0.5×, Medium 1×, and Hard 1.5× score multipliers and shows how the level multiplier combines with difficulty for line clears

### Requirement: Difficulty selection
The selected difficulty SHALL determine both gravity speed and the multiplier
for score awards. It SHALL be part of deterministic rules state and SHALL be
preserved when the game restarts during the same session. Changing difficulty
while paused SHALL NOT change points already earned; subsequent awards SHALL
use the newly selected difficulty multiplier.

#### Scenario: Difficulty is part of a replay
- **WHEN** two seeded games receive the same gameplay actions and difficulty selections
- **THEN** their scores and game states remain identical at every step

#### Scenario: Restart preserves difficulty
- **WHEN** the user restarts after selecting Hard
- **THEN** score, lines, and level reset while Hard remains selected
