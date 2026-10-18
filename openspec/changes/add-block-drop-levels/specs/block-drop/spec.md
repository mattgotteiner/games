## MODIFIED Requirements

### Requirement: Deterministic score
Block Drop SHALL start each new game at zero points, add one point for every row successfully advanced by soft drop, add two points for every row advanced by hard drop, and add 100, 300, 500, or 800 points multiplied by the current level when a lock clears one, two, three, or four rows together respectively. The level used for a clear SHALL be the level before that clear's lines are counted. Automatic descent SHALL NOT award drop points.

#### Scenario: New game starts
- **WHEN** a new Block Drop game starts
- **THEN** its score is zero

#### Scenario: Player soft drops
- **WHEN** soft drop successfully advances the active piece by one row
- **THEN** the score increases by one point

#### Scenario: Player hard drops
- **WHEN** hard drop advances the active piece by one or more rows before locking
- **THEN** the score increases by two points for each row advanced

#### Scenario: Automatic descent advances
- **WHEN** gravity advances the active piece
- **THEN** the score does not change

#### Scenario: Rows clear together
- **WHEN** a lock clears one, two, three, or four rows simultaneously
- **THEN** the score additionally increases by 100, 300, 500, or 800 points respectively, multiplied by the level before the clear

#### Scenario: Clear reaches a new level
- **WHEN** a lock clears lines that move the game from one level to the next
- **THEN** the line-clear points use the earlier level's multiplier

#### Scenario: Game ends
- **WHEN** the game reaches game over
- **THEN** the final score remains displayed until the user restarts or leaves

#### Scenario: User restarts
- **WHEN** the user starts a fresh game
- **THEN** the score resets to zero

### Requirement: Visible scoring explanation
Block Drop SHALL make a scoring guide available on demand from a labelled help control that is always visible in the game header. The guide SHALL open in a modal dialog that states that each successful soft-drop row earns 1 point, each hard-drop row earns 2 points, automatic gravity earns no points, and clearing one, two, three, or four lines at once earns 100, 300, 500, or 800 points respectively multiplied by the current level, and SHALL explain that the level rises every ten lines and increases the falling speed. The guide SHALL also list the keyboard controls. The displayed values SHALL remain consistent with the deterministic score calculation. Opening the guide during active play SHALL pause the game, and closing the guide SHALL leave the game paused and return focus to the help control.

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

## ADDED Requirements

### Requirement: Level progression
Block Drop SHALL count the lines cleared in the current game and SHALL derive the level as the number of lines cleared divided by ten, rounded down, plus one. The automatic descent interval SHALL be the greater of 80 milliseconds and 700 milliseconds multiplied by 0.85 raised to the power of one less than the level, rounded to the nearest millisecond. Lines and level SHALL be part of the deterministic game state, SHALL reset on restart, and SHALL be shown with readable labels in the game HUD at every supported viewport. A level change SHALL be announced and SHALL briefly highlight the displayed level unless reduced motion is preferred.

#### Scenario: New game starts
- **WHEN** a new Block Drop game starts
- **THEN** lines is zero, level is one, and automatic descent occurs every 700 milliseconds

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

### Requirement: Line-clear callout
When a lock clears lines, Block Drop SHALL briefly show a callout over the playfield with the points earned and the size of the clear. The callout SHALL NOT be the only way this information is conveyed, SHALL NOT block input once line-clear feedback ends, and SHALL appear without movement when reduced motion is preferred.

#### Scenario: Lines are cleared
- **WHEN** a lock clears one or more lines
- **THEN** a callout shows the points awarded and names the clear size, then disappears shortly after the line-clear feedback ends

#### Scenario: Reduced motion is preferred
- **WHEN** reduced motion is preferred and lines are cleared
- **THEN** the callout appears and disappears without animated movement
