## MODIFIED Requirements

### Requirement: Difficulty selection
Block Drop SHALL start at Medium difficulty unless a valid device preference is saved. It SHALL provide an accessible three-position difficulty slider in the pause menu. Easy SHALL make automatic descent half as fast as the selected level curve, Medium SHALL use the level curve unchanged, and Hard SHALL make it 1.5 times as fast, subject to the 80-millisecond minimum interval. The same 0.5×, 1×, or 1.5× setting SHALL scale future manual score awards. Changing difficulty SHALL NOT change the current score, line progression, or level. The selected mode and its multiplier SHALL be visible in the game HUD while playing, paused, and at game over. A selection SHALL remain active after restarting and SHALL be restored the next time Block Drop is opened on the same device. Missing, invalid, or unavailable stored preferences SHALL use Medium without preventing play.

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

#### Scenario: Difficulty is changed while paused
- **WHEN** the user changes difficulty in the pause menu
- **THEN** the board, active piece, next piece, score, lines, and level stay unchanged until play resumes, and the new choice is saved for the next launch

#### Scenario: Restart after choosing difficulty
- **WHEN** the user restarts after changing difficulty
- **THEN** lines, level, and score reset while the selected difficulty remains active and saved
