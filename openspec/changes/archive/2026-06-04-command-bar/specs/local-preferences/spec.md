## ADDED Requirements

### Requirement: Handedness preference

The system SHALL store the handedness preference ("right", "left") in localStorage under key `STORAGE_KEYS.HANDEDNESS`. Default value SHALL be "right". The `useHandedness` hook SHALL return the current value and a setter function.

#### Scenario: Default handedness is right
- **WHEN** no handedness has been saved
- **THEN** the handedness is "right"

#### Scenario: Handedness changes persist
- **WHEN** handedness is set to "left"
- **THEN** localStorage contains "left" under the handedness key

#### Scenario: Invalid stored value falls back to default
- **WHEN** localStorage contains "invalid" under the handedness key
- **THEN** the handedness is "right"
