# Onboarding Spec

## Purpose

Defines the onboarding experience for first-time users, including launch detection, dialog interaction, entity creation from a declarative template, and persistence of the onboarding state flag.

## Requirements

### Requirement: First-launch detection

The system SHALL determine whether the user is launching the app for the first time by checking:
1. localStorage flag `ONBOARDING_SHOWN` — if present, skip onboarding
2. If flag is absent, check DB for any active goals or tasks — if present, set flag silently and skip

The detection MUST complete in under 100ms (NFR-P1 of onboarding-goal).

#### Scenario: Brand new user (no flag, empty DB)
- **WHEN** user opens the app with no localStorage flag and an empty database
- **THEN** system shows the onboarding dialog

#### Scenario: Returning user (flag exists)
- **WHEN** user opens the app with the localStorage flag already set
- **THEN** system does not show the onboarding dialog

#### Scenario: Existing data but no flag (e.g. cleared storage)
- **WHEN** user opens the app with no localStorage flag but the database contains entities
- **THEN** system sets the localStorage flag silently and does not show the onboarding dialog

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

### Requirement: Onboarding entity creation

The system SHALL create one goal and multiple tasks from a declarative template. The goal MUST have status `active`. Each task MUST be assigned to the box specified in the template.

Created entities MUST be regular Goal and Task entities — they synchronize, can be edited, and can be deleted by the user (FR4 of onboarding-goal).

Entity names and descriptions MUST use the current app language via i18n at creation time.

#### Scenario: Goal created with correct attributes
- **WHEN** onboarding entities are created
- **THEN** a goal exists with the localized name, localized description, and status `active`

#### Scenario: Tasks created with correct box assignments
- **WHEN** onboarding entities are created
- **THEN** each task is assigned to the box defined in the template and linked to the onboarding goal

#### Scenario: Tasks have correct sort order
- **WHEN** onboarding entities are created
- **THEN** tasks are ordered according to their position in the template array

### Requirement: Declarative onboarding template

The template MUST be a TypeScript module exporting the goal definition and an ordered array of task definitions. Each task definition MUST include i18n key for name, i18n key for description, and box assignment.

Adding a new onboarding task MUST require only: appending to the template array and adding i18n keys to locale files (FR5, FR6 of onboarding-goal).

#### Scenario: Template defines goal and tasks
- **WHEN** the onboarding template is loaded
- **THEN** it contains a goal definition with nameKey and descriptionKey, and an array of task definitions each with nameKey, descriptionKey, and box

#### Scenario: Extending the template
- **WHEN** a developer adds a new entry to the tasks array and corresponding i18n keys
- **THEN** new users see the additional task without any other code changes

### Requirement: Onboarding localStorage flag

The system SHALL store a flag under `STORAGE_KEYS.ONBOARDING_SHOWN` in localStorage after the user either accepts or declines onboarding (FR7 of onboarding-goal).

#### Scenario: Flag set after accept
- **WHEN** user accepts onboarding
- **THEN** localStorage contains the `ONBOARDING_SHOWN` key

#### Scenario: Flag set after decline
- **WHEN** user declines onboarding
- **THEN** localStorage contains the `ONBOARDING_SHOWN` key

#### Scenario: Flag set for existing data
- **WHEN** detection finds existing data without a flag
- **THEN** localStorage contains the `ONBOARDING_SHOWN` key
