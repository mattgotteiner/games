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

### Requirement: Check for updates at startup and when the application resumes
The application SHALL explicitly check its registered service worker for an
update after registration and when a running page returns to the foreground,
including after Safari restores the page without a full navigation.

#### Scenario: A newer version is available after a full reload
- **WHEN** the page registers an existing service worker and a newer worker script is available
- **THEN** the application requests an update check and follows the normal download, activation, and single-reload flow

#### Scenario: A newer version is available on resume
- **WHEN** the page becomes visible, receives focus, or is restored through `pageshow`
- **AND** the registered service worker has a newer application copy
- **THEN** the application announces the update and follows the normal download, activation, and single-reload flow

#### Scenario: Resume while offline or already current
- **WHEN** the page returns to the foreground but no update check can complete or no newer copy exists
- **THEN** the current application remains usable without showing an update failure
