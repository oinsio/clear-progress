## MODIFIED Requirements

### Requirement: Panel side preference

The system SHALL store the panel side ("left", "right") in localStorage via `LocalPreferencesService`. Default value SHALL be platform-aware: `"left"` on desktop (above `LG_BREAKPOINT_PX`), `"right"` on mobile. Self-healing SHALL remove corrupted values and return the platform-appropriate default. Retained from previous iteration of improve-sidebar-ux.

#### Scenario: Default panel side is left on desktop
- **WHEN** no panel side has been saved
- **AND** viewport is above `LG_BREAKPOINT_PX`
- **THEN** the panel side is "left"

#### Scenario: Default panel side is right on mobile
- **WHEN** no panel side has been saved
- **AND** viewport is below `LG_BREAKPOINT_PX`
- **THEN** the panel side is "right"

#### Scenario: Saved panel side overrides platform default
- **WHEN** panel side "right" has been saved in localStorage
- **AND** viewport is above `LG_BREAKPOINT_PX`
- **THEN** the panel side is "right" (not the desktop default "left")

#### Scenario: Panel side changes persist
- **WHEN** panel side is set to "left"
- **THEN** localStorage contains "left" under the panel side key

#### Scenario: Corrupted panel side self-heals
- **WHEN** localStorage contains "center" under the panel side key
- **THEN** the panel side falls back to the platform-appropriate default
- **AND** the corrupted key is removed from localStorage

### Requirement: Sidebar mode preference

The system SHALL store the sidebar mode (`"expanded"`, `"collapsed"`, `"expand-on-hover"`) in localStorage via `LocalPreferencesService` under `STORAGE_KEYS.SIDEBAR_MODE`. Default value SHALL be `"expanded"`. Self-healing SHALL remove corrupted values and return `"expanded"`. Implements FR1 of improve-sidebar-ux.

#### Scenario: Default sidebar mode is expanded
- **WHEN** no sidebar mode has been saved
- **THEN** the sidebar mode is `"expanded"`

#### Scenario: Saved sidebar mode overrides default
- **WHEN** sidebar mode `"collapsed"` has been saved in localStorage
- **THEN** the sidebar mode is `"collapsed"`

#### Scenario: Sidebar mode changes persist
- **WHEN** sidebar mode is set to `"expand-on-hover"`
- **THEN** localStorage contains `"expand-on-hover"` under the sidebar mode key

#### Scenario: Corrupted sidebar mode self-heals
- **WHEN** localStorage contains `"auto"` under the sidebar mode key
- **THEN** the sidebar mode falls back to `"expanded"`
- **AND** the corrupted key is removed from localStorage

### Requirement: Migration from isPanelOpen to sidebarMode

On app startup, if `SIDEBAR_MODE` key does not exist in localStorage, the system SHALL migrate from the legacy `PANEL_OPEN` key: `"true"` maps to `"expanded"`, `"false"` maps to `"collapsed"`. After migration, the `PANEL_OPEN` key SHALL be removed. If neither key exists, the default `"expanded"` is used. Implements FR1 of improve-sidebar-ux.

#### Scenario: Migration from isPanelOpen true
- **WHEN** `SIDEBAR_MODE` key does not exist in localStorage
- **AND** `PANEL_OPEN` key contains `"true"`
- **THEN** sidebar mode is set to `"expanded"`
- **AND** `PANEL_OPEN` key is removed from localStorage

#### Scenario: Migration from isPanelOpen false
- **WHEN** `SIDEBAR_MODE` key does not exist in localStorage
- **AND** `PANEL_OPEN` key contains `"false"`
- **THEN** sidebar mode is set to `"collapsed"`
- **AND** `PANEL_OPEN` key is removed from localStorage

#### Scenario: No migration when sidebarMode already exists
- **WHEN** `SIDEBAR_MODE` key exists in localStorage
- **THEN** `PANEL_OPEN` key is NOT read or removed

#### Scenario: Fresh install with no legacy keys
- **WHEN** neither `SIDEBAR_MODE` nor `PANEL_OPEN` keys exist
- **THEN** sidebar mode defaults to `"expanded"`

### Requirement: Filter bar position preference

The system SHALL store the filter bar position ("top", "bottom") in localStorage via `LocalPreferencesService`. Default value SHALL be platform-aware: `"top"` on desktop (above `LG_BREAKPOINT_PX`), `"bottom"` on mobile. Self-healing SHALL remove corrupted values and return the platform-appropriate default. Retained from previous iteration of improve-sidebar-ux.

#### Scenario: Default filter bar position is top on desktop
- **WHEN** no filter bar position has been saved
- **AND** viewport is above `LG_BREAKPOINT_PX`
- **THEN** the filter bar position is "top"

#### Scenario: Default filter bar position is bottom on mobile
- **WHEN** no filter bar position has been saved
- **AND** viewport is below `LG_BREAKPOINT_PX`
- **THEN** the filter bar position is "bottom"

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

## REMOVED Requirements

### Requirement: Panel open state (boolean)

**Reason**: Replaced by sidebar mode enum (`"expanded"` / `"collapsed"` / `"expand-on-hover"`). Boolean `isPanelOpen` could not represent the third mode. Migration handles existing users. Implements FR1 of improve-sidebar-ux.

### Requirement: Panel always-open preference

**Reason**: Already removed in previous iteration. Migration to `isPanelOpen=true` was handled. Now further migrated to `sidebarMode="expanded"`.
