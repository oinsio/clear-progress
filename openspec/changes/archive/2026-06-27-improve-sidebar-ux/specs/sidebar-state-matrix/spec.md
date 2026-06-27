## ADDED Requirements

### Requirement: Sidebar mode stored as enum preference

The user setting for sidebar mode SHALL be one of three values: `"expanded"`, `"collapsed"`, `"expand-on-hover"`. This is the user's declarative preference, independent of screen width or hover capability. Stored in localStorage under `STORAGE_KEYS.SIDEBAR_MODE`. Implements FR1 of improve-sidebar-ux.

### Requirement: Effective state resolved from three factors

The effective sidebar state SHALL be resolved by a pure function `resolveSidebarState` from three independent inputs: screen width (`isNarrow`: boolean, based on breakpoint), hover capability (`hasHover`: boolean, from `@media (hover: hover)`), and user setting (`sidebarMode`). The function returns one of three effective states: `"expanded"`, `"collapsed"`, `"hover-ready"`. Implements FR8 of improve-sidebar-ux.

#### Scenario: Wide + hover + expanded setting
- **WHEN** screen is wide, hover is available, setting is `"expanded"`
- **THEN** effective state is `"expanded"`

#### Scenario: Wide + hover + collapsed setting
- **WHEN** screen is wide, hover is available, setting is `"collapsed"`
- **THEN** effective state is `"collapsed"`

#### Scenario: Wide + hover + hover setting
- **WHEN** screen is wide, hover is available, setting is `"expand-on-hover"`
- **THEN** effective state is `"hover-ready"`

#### Scenario: Wide + no hover + expanded setting
- **WHEN** screen is wide, hover is NOT available, setting is `"expanded"`
- **THEN** effective state is `"expanded"`

#### Scenario: Wide + no hover + collapsed setting
- **WHEN** screen is wide, hover is NOT available, setting is `"collapsed"`
- **THEN** effective state is `"collapsed"`

#### Scenario: Wide + no hover + hover setting (fallback)
- **WHEN** screen is wide, hover is NOT available, setting is `"expand-on-hover"`
- **THEN** effective state is `"collapsed"` (hover unavailable, fallback)

#### Scenario: Narrow + hover + expanded setting (compromise)
- **WHEN** screen is narrow, hover is available, setting is `"expanded"`
- **THEN** effective state is `"hover-ready"` (expanded won't fit, hover as compromise)

#### Scenario: Narrow + hover + collapsed setting
- **WHEN** screen is narrow, hover is available, setting is `"collapsed"`
- **THEN** effective state is `"collapsed"`

#### Scenario: Narrow + hover + hover setting
- **WHEN** screen is narrow, hover is available, setting is `"expand-on-hover"`
- **THEN** effective state is `"hover-ready"` (direct match)

#### Scenario: Narrow + no hover + expanded setting (fallback)
- **WHEN** screen is narrow, hover is NOT available, setting is `"expanded"`
- **THEN** effective state is `"collapsed"` (neither expanded nor hover possible)

#### Scenario: Narrow + no hover + collapsed setting
- **WHEN** screen is narrow, hover is NOT available, setting is `"collapsed"`
- **THEN** effective state is `"collapsed"` (direct match)

#### Scenario: Narrow + no hover + hover setting (fallback)
- **WHEN** screen is narrow, hover is NOT available, setting is `"expand-on-hover"`
- **THEN** effective state is `"collapsed"` (hover unavailable, fallback)

### Requirement: Hover capability detection via matchMedia

The system SHALL detect hover capability using `window.matchMedia('(hover: hover)')` with a change listener. The hook `useHoverCapability` SHALL return `hasHover: boolean` and update reactively when input device changes (e.g., tablet connects/disconnects keyboard with trackpad). Implements FR8, NFR-R3 of improve-sidebar-ux.

#### Scenario: Mouse available reports hover
- **WHEN** primary input device supports hover (e.g., mouse, trackpad)
- **THEN** `hasHover` is `true`

#### Scenario: Touch-only reports no hover
- **WHEN** primary input device does NOT support hover (e.g., touchscreen only)
- **THEN** `hasHover` is `false`

#### Scenario: Hover capability updates reactively
- **WHEN** user connects keyboard with trackpad to tablet
- **AND** `@media (hover: hover)` starts matching
- **THEN** `hasHover` updates to `true`
- **AND** effective sidebar state recalculates

### Requirement: Resize recalculates effective state

When screen width crosses the breakpoint (resize), the effective sidebar state SHALL be recalculated from the state matrix. The user setting in localStorage SHALL NOT change on resize. Implements FR14 of improve-sidebar-ux.

#### Scenario: Resize does not change saved setting
- **WHEN** user setting is `"expanded"`
- **AND** screen resizes from wide to narrow
- **THEN** `sidebarMode` in localStorage remains `"expanded"`
- **AND** effective state changes per the matrix

### Requirement: Resize from wide to narrow with hover-expanded

When resizing from wide to narrow while sidebar is hover-expanded, the overlay SHALL close and sidebar SHALL transition to hover-ready (if hover available) or collapsed (if no hover). Implements FR15 of improve-sidebar-ux.

#### Scenario: Wide to narrow closes hover overlay
- **WHEN** sidebar is hover-expanded on wide screen
- **AND** screen resizes to narrow
- **THEN** hover overlay closes
- **AND** effective state becomes `hover-ready` (if hover available)

### Requirement: Resize from narrow to wide restores saved setting

When resizing from narrow to wide, the effective state SHALL match the saved sidebar mode setting. Implements FR16 of improve-sidebar-ux.

#### Scenario: Narrow to wide restores expanded
- **WHEN** setting is `"expanded"`
- **AND** screen resizes from narrow to wide
- **THEN** effective state becomes `"expanded"`

#### Scenario: Narrow to wide restores hover-ready
- **WHEN** setting is `"expand-on-hover"` and hover is available
- **AND** screen resizes from narrow to wide
- **THEN** effective state becomes `"hover-ready"`

### Requirement: Resize from narrow to wide closes drawer

When drawer is open during resize from narrow to wide, the drawer and backdrop SHALL close, and the saved setting SHALL be applied. Implements FR17 of improve-sidebar-ux.

#### Scenario: Drawer closes on resize to wide
- **WHEN** drawer is open on narrow screen
- **AND** screen resizes to wide
- **THEN** drawer closes
- **AND** backdrop is removed
- **AND** effective state matches saved setting
