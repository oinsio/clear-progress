## ADDED Requirements

### Requirement: Detail panel pinned preference

The system SHALL store the detail panel pinned state as a boolean in localStorage via `LocalPreferencesService` under key `STORAGE_KEYS.DETAIL_PANEL_PINNED`. Default value SHALL be `false`. Self-healing SHALL remove corrupted values and return `false`. Implements FR1, FR2, FR8 of pin-task-detail-panel.

#### Scenario: Default detail panel pinned is false

- **WHEN** no detail panel pinned preference has been saved
- **THEN** detail panel pinned is `false`

#### Scenario: Detail panel pinned preference persists

- **WHEN** detail panel pinned is set to `true`
- **THEN** localStorage contains "true" under the detail panel pinned key

#### Scenario: Corrupted detail panel pinned self-heals

- **WHEN** localStorage contains "maybe" under the detail panel pinned key
- **THEN** detail panel pinned falls back to `false`
- **AND** the corrupted key is removed from localStorage

#### Scenario: useDetailPanelPinned returns tuple

- **WHEN** the hook is called
- **THEN** it returns `[isDetailPanelPinned, setDetailPanelPinned]` with stable setter reference
