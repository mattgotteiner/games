## Purpose

Make replacement of an out-of-date running application copy understandable by
communicating download, activation, and failure states before navigation occurs.

## ADDED Requirements

### Requirement: Notify when the running copy is out of date
The application SHALL display a persistent update notification when it detects
that a newer application copy is being downloaded for a page controlled by an
older service worker.

#### Scenario: New copy begins downloading
- **WHEN** an update is found while the current page is controlled by an existing service worker
- **THEN** the application displays that the current copy is out of date and the latest version is downloading

#### Scenario: Service worker is installed for the first time
- **WHEN** the application installs its first service worker for a page that is not already controlled
- **THEN** the application does not describe the newly opened copy as out of date

#### Scenario: No update is available
- **WHEN** the running copy is current or no update check can complete while offline
- **THEN** the application continues without displaying an update notification

### Requirement: Communicate loading before automatic replacement
The application SHALL clearly announce that the latest version has downloaded
and is loading before it activates the replacement and reloads the page.

#### Scenario: New copy is ready
- **WHEN** the replacement application copy finishes downloading
- **THEN** the notification changes to state that the update is ready and the latest version is loading
- **AND** the application activates the replacement only after the loading state has been presented

#### Scenario: Replacement takes control
- **WHEN** the replacement service worker takes control after the application initiated activation
- **THEN** the application reloads the current URL exactly once into the latest copy

### Requirement: Keep update status visible and accessible
Update notifications SHALL remain visible above both the catalog and an active
game, and status changes SHALL be announced to assistive technology without
requiring user interaction.

#### Scenario: Update is detected during a game
- **WHEN** an update begins while a game is active
- **THEN** the update notification remains visible without replacing the game until the latest version begins loading

#### Scenario: Update status changes
- **WHEN** the notification changes from downloading to loading or failure
- **THEN** assistive technology announces the new status

### Requirement: Explain update failure without forced navigation
The application SHALL show an actionable failure notification when a detected
update cannot be downloaded or activated, and SHALL keep the current copy usable
without automatically reloading it.

#### Scenario: Download or activation fails
- **WHEN** the replacement service worker reports a failed installation or the update request rejects
- **THEN** the application explains that the latest version could not be loaded
- **AND** the notification tells the user to check the connection and reload to try again
- **AND** the application does not automatically reload the current page
