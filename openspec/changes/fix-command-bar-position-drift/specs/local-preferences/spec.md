## MODIFIED Requirements

### Requirement: Filter bar position preference

The system SHALL store the filter bar position ("top", "bottom") in localStorage via `LocalPreferencesService`. Default value SHALL be platform-aware: `"top"` on desktop (above `LG_BREAKPOINT_PX`), `"bottom"` on mobile. On the very first visit (no stored value), the system SHALL persist the platform default to localStorage so that subsequent viewport changes do not alter the position. Self-healing SHALL remove corrupted values and return the platform-appropriate default. Retained from previous iteration of improve-sidebar-ux.

#### Scenario: Default filter bar position is top on desktop
- **WHEN** no filter bar position has been saved
- **AND** viewport is above `LG_BREAKPOINT_PX`
- **THEN** the filter bar position is "top"
- **AND** "top" is persisted to localStorage

#### Scenario: Default filter bar position is bottom on mobile
- **WHEN** no filter bar position has been saved
- **AND** viewport is below `LG_BREAKPOINT_PX`
- **THEN** the filter bar position is "bottom"
- **AND** "bottom" is persisted to localStorage

#### Scenario: Position does not change on viewport resize after first visit
- **WHEN** filter bar position "top" has been persisted on first visit (desktop)
- **AND** viewport is resized below `LG_BREAKPOINT_PX`
- **THEN** the filter bar position remains "top"

#### Scenario: Saved filter bar position overrides platform default
- **WHEN** filter bar position "bottom" has been saved in localStorage
- **AND** viewport is above `LG_BREAKPOINT_PX`
- **THEN** the filter bar position is "bottom" (not the desktop default "top")

#### Scenario: Filter bar position changes persist
- **WHEN** filter bar position is set to "top"
- **THEN** localStorage contains "top" under the filter bar position key

#### Scenario: Corrupted filter bar position self-heals
- **WHEN** localStorage contains "middle" under the filter bar position key
- **THEN** the filter bar position falls back to the platform-appropriate default
- **AND** the corrupted key is removed from localStorage
