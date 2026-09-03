## ADDED Requirements

### Requirement: Visible scoring explanation
Block Drop SHALL present an always-visible scoring guide inside the Game
information HUD. The guide SHALL state that each successful soft-drop row earns
1 point, each hard-drop row earns 2 points, automatic gravity earns no points,
and clearing one, two, three, or four lines at once earns 100, 300, 500, or 800
points respectively. The displayed values SHALL remain consistent with the
deterministic score calculation.

#### Scenario: Player inspects the score
- **WHEN** the Block Drop play screen is presented
- **THEN** the Game information HUD identifies every action that can change the score and the number of points it awards

#### Scenario: Player presses soft drop
- **WHEN** a successful soft drop increases the score by one point
- **THEN** the visible scoring guide explains that soft drop earns one point per row

#### Scenario: Automatic gravity advances
- **WHEN** gravity moves a piece downward without changing the score
- **THEN** the visible scoring guide explains that automatic gravity earns no points

#### Scenario: Constrained viewport is presented
- **WHEN** the game is shown on a portrait or short-landscape phone viewport
- **THEN** the complete scoring guide remains readable and discoverable without clipping the game or forcing page scrolling

#### Scenario: Scoring guide is inspected semantically
- **WHEN** a user or assistive technology inspects the Game information HUD
- **THEN** the scoring guide has a readable label and associates each scoring action with its point value
