## MODIFIED Requirements

### Requirement: Panel side preference

The system SHALL store the panel side ("left", "right") in localStorage via `LocalPreferencesService`. Default value SHALL be platform-aware: `"left"` on desktop (above `LG_BREAKPOINT_PX`), `"right"` on mobile. Self-healing SHALL remove corrupted values and return the platform-appropriate default. Implements FR7 of improve-sidebar-ux.

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

### Requirement: Panel open state

The system SHALL store whether the panel is open (boolean) in localStorage via `LocalPreferencesService`. Default value SHALL be platform-aware: `true` on desktop (above `LG_BREAKPOINT_PX`), `false` on mobile. Self-healing SHALL remove corrupted values and return the platform-appropriate default. Implements FR7 of improve-sidebar-ux.

#### Scenario: Default panel open is true on desktop
- **WHEN** no panel open preference has been saved
- **AND** viewport is above `LG_BREAKPOINT_PX`
- **THEN** panel open is `true`

#### Scenario: Default panel open is false on mobile
- **WHEN** no panel open preference has been saved
- **AND** viewport is below `LG_BREAKPOINT_PX`
- **THEN** panel open is `false`

#### Scenario: Saved panel open overrides platform default
- **WHEN** panel open `false` has been saved in localStorage
- **AND** viewport is above `LG_BREAKPOINT_PX`
- **THEN** panel open is `false` (not the desktop default `true`)

#### Scenario: Panel open state persists
- **WHEN** panel open is set to `true`
- **THEN** localStorage contains "true" under the panel open key

#### Scenario: Corrupted panel open self-heals
- **WHEN** localStorage contains "maybe" under the panel open key
- **THEN** panel open falls back to the platform-appropriate default
- **AND** the corrupted key is removed from localStorage

### Requirement: Filter bar position preference

The system SHALL store the filter bar position ("top", "bottom") in localStorage via `LocalPreferencesService`. Default value SHALL be platform-aware: `"top"` on desktop (above `LG_BREAKPOINT_PX`), `"bottom"` on mobile. Self-healing SHALL remove corrupted values and return the platform-appropriate default. Implements FR7 of improve-sidebar-ux.

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

### Requirement: Panel open state (original with always-open)

**Reason**: The panel always-open preference is removed. `isPanelOpen=true` provides the same persistent-open behavior. Implements FR10 of improve-sidebar-ux.

**Migration**: On app startup, if `PANEL_ALWAYS_OPEN` key exists in localStorage with value `"true"`, set `PANEL_OPEN` to `"true"` and remove `PANEL_ALWAYS_OPEN` key.
