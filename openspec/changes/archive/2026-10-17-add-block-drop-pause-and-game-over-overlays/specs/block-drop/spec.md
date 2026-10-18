## MODIFIED Requirements

### Requirement: Manual pause and resume
Block Drop SHALL let the user pause and resume an active game without changing the board, active piece, next piece, or score. While paused, gravity and movement, rotation, soft-drop, and hard-drop actions SHALL have no effect. While paused, the playfield SHALL be covered by a dimming veil and a labelled pause panel offering resume and restart actions, and focus SHALL move to the resume action.

#### Scenario: User pauses active play
- **WHEN** the user activates pause during an active game
- **THEN** the state becomes paused, the current board, piece, preview, and score remain unchanged, and the playfield is covered by the pause veil and panel with focus on resume

#### Scenario: Time passes while paused
- **WHEN** animation frames continue while the game is paused
- **THEN** the active piece does not descend and no paused time accumulates toward a later gravity step

#### Scenario: Gameplay input arrives while paused
- **WHEN** the user requests movement, rotation, soft drop, or hard drop while paused
- **THEN** the game state remains unchanged

#### Scenario: User resumes
- **WHEN** the user activates resume from the paused state
- **THEN** the veil and panel are removed and active play continues from the same board, piece, preview, and score with a fresh gravity interval

#### Scenario: User restarts while paused
- **WHEN** the user activates restart from the paused state
- **THEN** a fresh unpaused game starts with score zero

### Requirement: Game over and restart
Block Drop SHALL end the game when a newly spawned piece has no valid position and SHALL allow the user to start a fresh game. At game over, a card over the playfield SHALL present the final score, the best score, an indication when the final score set a new best, a play-again action that receives focus, and a return-to-catalog action. The game-over state SHALL be conveyed with readable text rather than Canvas-drawn text.

#### Scenario: Spawn area is obstructed
- **WHEN** the next piece cannot occupy its initial position
- **THEN** automatic descent and gameplay actions stop and the game-over card is shown over the dimmed playfield

#### Scenario: Game-over card is presented
- **WHEN** the game reaches game over
- **THEN** the card shows the final score and the best score, and focus is on the play-again action

#### Scenario: A new best score is set
- **WHEN** the game ends with a score higher than the stored best score
- **THEN** the card indicates a new best and shows the final score as the best score

#### Scenario: Restart after game over
- **WHEN** the user activates play again from the game-over card
- **THEN** a new game starts with an empty playfield and an active piece

### Requirement: Session action placement
Block Drop SHALL present pause/resume, help, and restart as session actions that are visually and structurally separate from the movement, rotation, and drop controls. No session action SHALL be adjacent to the hard-drop control. The restart action SHALL be presented only within the pause panel and the game-over card. Keyboard shortcuts for pause and restart SHALL remain available in every game state.

#### Scenario: User scans the gameplay controls
- **WHEN** the Block Drop play screen is presented at any supported viewport
- **THEN** the gameplay control groups contain only movement, rotation, soft-drop, and hard-drop controls, and no session action sits beside the hard-drop control

#### Scenario: Restart is sought during active play
- **WHEN** the game is playing
- **THEN** no visible restart control is presented, and pausing reveals one in the pause panel

#### Scenario: User restarts from the keyboard
- **WHEN** the user presses the documented restart key in any game state
- **THEN** a fresh game starts

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

## ADDED Requirements

### Requirement: Best score persistence
Block Drop SHALL keep the highest final score achieved on the device and SHALL preserve it across reloads, application updates, and offline launches. If device storage is unavailable or holds an unreadable value, the game SHALL treat the best score as zero and remain fully playable.

#### Scenario: Best score survives a reload
- **WHEN** a game ends with a new best score and the application is reloaded
- **THEN** the next game-over card shows that best score

#### Scenario: Storage is unavailable
- **WHEN** reading or writing device storage fails
- **THEN** the game remains playable and the game-over card shows the best score known in the current session

### Requirement: Automatic pause when hidden
Block Drop SHALL pause an active game when the page becomes hidden, and SHALL remain paused when the page becomes visible again until the user resumes.

#### Scenario: User switches away during play
- **WHEN** the page becomes hidden while the game is playing
- **THEN** the game becomes paused

#### Scenario: User returns
- **WHEN** the page becomes visible again after an automatic pause
- **THEN** the game remains paused with the pause panel presented

#### Scenario: Page hides while not playing
- **WHEN** the page becomes hidden while the game is already paused or over
- **THEN** the game state does not change
