## MODIFIED Requirements

### Requirement: Onboarding dialog

The system SHALL display a modal dialog over the app shell offering the user to start onboarding. The dialog MUST have two actions: accept and decline.

The accept button MUST use the app's accent color (`bg-accent`) from the design system, not a hardcoded blue. The hover state MUST use `bg-accent/80`.

The dialog MUST be accessible: focus trap, Escape to close, screen reader labels (NFR-A1, NFR-A2 of onboarding-goal). The dialog MUST render correctly from 320px to 2560px viewport width (NFR-R1 of onboarding-goal).

#### Scenario: User accepts onboarding
- **WHEN** user clicks the accept action in the onboarding dialog
- **THEN** system creates the onboarding goal and tasks, sets the localStorage flag, and closes the dialog

#### Scenario: User declines onboarding
- **WHEN** user clicks the decline action in the onboarding dialog
- **THEN** system sets the localStorage flag, closes the dialog, and creates no entities

#### Scenario: User presses Escape
- **WHEN** user presses Escape while the onboarding dialog is open
- **THEN** system treats it as decline — sets the flag and closes the dialog

#### Scenario: Accept button uses accent color
- **WHEN** the onboarding dialog is displayed
- **THEN** the accept button uses the accent color from the design system
