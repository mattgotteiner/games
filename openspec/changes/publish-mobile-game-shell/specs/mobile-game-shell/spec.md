## Purpose

Provide the smallest public, mobile-friendly catalog surface so deployment and
responsive-shell behavior can be validated before games or offline features are
introduced.

## ADDED Requirements

### Requirement: Catalog shell startup
The application SHALL present the game catalog when a user opens the deployed
`/games/` site without requiring a backend service.

#### Scenario: Open the deployed site
- **WHEN** a user opens the deployed `/games/` URL
- **THEN** the application displays its identity and game catalog

### Requirement: Honest empty catalog
The catalog SHALL clearly communicate when no games are available and SHALL NOT
present a nonfunctional game launch action.

#### Scenario: No games are registered
- **WHEN** the catalog contains no games
- **THEN** the user sees a "No games yet" empty state with no play control

### Requirement: Responsive mobile shell
The application SHALL keep its identity and empty catalog usable without
horizontal page scrolling at supported phone portrait and landscape viewport
sizes.

#### Scenario: Open on a phone-sized viewport
- **WHEN** the catalog is displayed at a phone portrait or landscape viewport
- **THEN** the visible shell fits the viewport and its text remains readable

### Requirement: Basic keyboard accessibility
The application SHALL expose a meaningful document title, heading hierarchy,
and visible keyboard focus for any interactive shell controls.

#### Scenario: Navigate the shell by keyboard
- **WHEN** a keyboard user moves focus through available shell controls
- **THEN** each focused control has a visible focus indicator and an accessible
  name
