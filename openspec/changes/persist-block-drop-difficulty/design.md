## Context

Difficulty is already part of `BlockDropState`, selected from the pause menu,
and retained when the current game restarts. It is not shown during active play
and a newly created controller defaults to Medium. The pause slider already
shows the selected mode and speed description.

## Goals / Non-Goals

**Goals:**

- Make the current difficulty easy to see while playing, paused, or at game
  over.
- Restore the player's last selected difficulty when they open Block Drop
  again.
- Keep the game playable when local storage is unavailable or contains an
  invalid value.

**Non-Goals:**

- Changing the difficulty slider or the score and gravity multipliers.
- Storing separate scores by difficulty.
- Syncing the setting across devices.

## Decisions

### Show difficulty in the HUD progress row

Add a labelled Difficulty value beside Level and Lines. Display the mode and
its multiplier, such as `Hard 1.5×`, so the player can see the active mode
without opening Pause. Keep the value in the existing progress group so it
remains visible in compact phone layouts and in paused and game-over states.
Give the mode and multiplier fixed-width columns, and use tabular numerals for
the multiplier, so switching modes does not move the surrounding HUD values.

### Persist one device preference

Store the selected mode under `games.block-drop.difficulty`. Read it when the
game component mounts and pass it into initial game creation. Accept only Easy,
Medium, or Hard; default to Medium for missing or invalid values. Catch storage
errors on both read and write, matching the optional best-score persistence
behaviour. Write a new value when the player changes the pause slider.

The initial state factory will accept an optional difficulty while retaining
Medium as the default for existing callers. Difficulty remains part of the
deterministic state and restart continues to keep the current mode.

## Risks / Trade-offs

- A third progress value could crowd very narrow HUDs -> Keep the label compact
  and verify the existing phone viewports still fit without scrolling.
- Saved preferences may be malformed or inaccessible -> Validate against the
  three known modes and fall back to Medium without interrupting play.

## Migration Plan

1. Add a validated, optional difficulty to initial game creation.
2. Read and write the device preference from the game component.
3. Show the selected mode and multiplier in the HUD.
4. Add component and browser coverage, then run `npm run check`.
