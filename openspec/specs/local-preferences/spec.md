## Requirements

### Requirement: Color scheme preference

The system SHALL store the color scheme preference ("system", "light", "dark") in localStorage under key `STORAGE_KEYS.COLOR_SCHEME` via `LocalPreferencesService`. Default value SHALL be "system". Reading SHALL use `getPreference` with type `"enum"`. Self-healing SHALL remove corrupted values and return "system".

#### Scenario: Default color scheme is system
- **WHEN** no color scheme has been saved
- **THEN** the color scheme is "system"

#### Scenario: Color scheme persists across sessions
- **WHEN** color scheme is set to "dark"
- **THEN** localStorage contains "dark" under the color scheme key

#### Scenario: Corrupted color scheme self-heals
- **WHEN** localStorage contains "invalid_scheme" under the color scheme key
- **THEN** the color scheme falls back to "system"
- **AND** the corrupted key is removed from localStorage

### Requirement: Panel side preference

The system SHALL store the panel side ("left", "right") in localStorage via `LocalPreferencesService`. Default value SHALL be "right". Self-healing SHALL remove corrupted values and return "right".

#### Scenario: Default panel side is right
- **WHEN** no panel side has been saved
- **THEN** the panel side is "right"

#### Scenario: Panel side changes persist
- **WHEN** panel side is set to "left"
- **THEN** localStorage contains "left" under the panel side key

#### Scenario: Corrupted panel side self-heals
- **WHEN** localStorage contains "center" under the panel side key
- **THEN** the panel side falls back to "right"
- **AND** the corrupted key is removed from localStorage

### Requirement: Panel open state

The system SHALL store whether the panel is open (boolean) in localStorage via `LocalPreferencesService`. The system SHALL also store the panel always-open preference (boolean) separately. Self-healing SHALL remove corrupted values and return `false`.

#### Scenario: Panel open state persists
- **WHEN** panel open is set to `true`
- **THEN** localStorage contains "true" under the panel open key

#### Scenario: Panel always-open state persists
- **WHEN** panel always-open is set to `true`
- **THEN** localStorage contains "true" under the panel always-open key

#### Scenario: Corrupted panel open self-heals
- **WHEN** localStorage contains "maybe" under the panel open key
- **THEN** panel open falls back to `false`
- **AND** the corrupted key is removed from localStorage

### Requirement: Focus mode with opacity

The system SHALL store focus mode (boolean, default `true`) and focus opacity (number, default 30) in localStorage via `LocalPreferencesService`. Self-healing SHALL remove corrupted values and return defaults.

#### Scenario: Default focus mode is enabled
- **WHEN** no focus mode has been saved
- **THEN** focus mode is `true`

#### Scenario: Default focus opacity is 30
- **WHEN** no focus opacity has been saved
- **THEN** focus opacity is 30

#### Scenario: Focus mode toggle persists
- **WHEN** focus mode is set to `false`
- **THEN** localStorage contains "false" under the focus mode key

#### Scenario: Focus opacity persists as number
- **WHEN** focus opacity is set to 15
- **THEN** localStorage contains "15" under the focus opacity key

#### Scenario: Invalid opacity self-heals
- **WHEN** localStorage contains "not-a-number" under the focus opacity key
- **THEN** focus opacity is 30
- **AND** the corrupted key is removed from localStorage

### Requirement: Interface scale preference

The system SHALL store the interface scale ("small", "normal", "large", "xLarge") in localStorage via `LocalPreferencesService`. Default value SHALL be "normal". Self-healing SHALL remove corrupted values and return "normal".

#### Scenario: Default interface scale is normal
- **WHEN** no interface scale has been saved
- **THEN** the interface scale is "normal"

#### Scenario: Interface scale changes persist
- **WHEN** interface scale is set to "large"
- **THEN** localStorage contains "large" under the interface scale key

#### Scenario: Corrupted interface scale self-heals
- **WHEN** localStorage contains "huge" under the interface scale key
- **THEN** the interface scale falls back to "normal"
- **AND** the corrupted key is removed from localStorage

### Requirement: Filter bar position preference

The system SHALL store the filter bar position ("top", "bottom") in localStorage via `LocalPreferencesService`. Default value SHALL be "bottom". Self-healing SHALL remove corrupted values and return "bottom".

#### Scenario: Default filter bar position is bottom
- **WHEN** no filter bar position has been saved
- **THEN** the filter bar position is "bottom"

#### Scenario: Filter bar position changes persist
- **WHEN** filter bar position is set to "top"
- **THEN** localStorage contains "top" under the filter bar position key

#### Scenario: Corrupted filter bar position self-heals
- **WHEN** localStorage contains "middle" under the filter bar position key
- **THEN** the filter bar position falls back to "bottom"
- **AND** the corrupted key is removed from localStorage

### Requirement: Section collapse state

The system SHALL store section collapse states as a JSON object (`Record<string, boolean>`) in localStorage via `LocalPreferencesService`. Default state for any section SHALL be expanded (not collapsed). Self-healing SHALL remove corrupted JSON and return empty object.

#### Scenario: Section is expanded by default
- **WHEN** no collapse state has been saved for section "inbox"
- **THEN** section "inbox" is not collapsed

#### Scenario: Section collapse state persists
- **WHEN** section "inbox" is collapsed
- **THEN** localStorage contains a JSON object with "inbox" set to `true`

#### Scenario: Invalid JSON self-heals
- **WHEN** localStorage contains invalid JSON under the section collapse key
- **THEN** all sections are treated as expanded
- **AND** the corrupted key is removed from localStorage

### Requirement: Language preference

The system SHALL store the language code in localStorage via `LocalPreferencesService`. Default value SHALL be "en". The system SHALL detect the browser language on first load and use it if a matching translation exists. The key value `"language"` SHALL remain stable as it is also used by i18next-browser-languagedetector.

#### Scenario: Default language is English
- **WHEN** no language has been saved and browser language detection yields no match
- **THEN** the language is "en"

#### Scenario: Language preference persists
- **WHEN** language is set to "ru"
- **THEN** localStorage contains "ru" under the language key

### Requirement: Show hidden tasks preference

The system SHALL store whether to show hidden (future-dated) tasks as a boolean in localStorage via `LocalPreferencesService`. Default value SHALL be `false`. Self-healing SHALL remove corrupted values and return `false`.

#### Scenario: Hidden tasks are not shown by default
- **WHEN** no show-hidden-tasks preference has been saved
- **THEN** show hidden tasks is `false`

#### Scenario: Show hidden tasks preference persists
- **WHEN** show hidden tasks is set to `true`
- **THEN** localStorage contains "true" under the show hidden tasks key

### Requirement: Handedness preference

The system SHALL store the handedness preference ("right", "left") in localStorage via `LocalPreferencesService`. Default value SHALL be "right". Self-healing SHALL remove corrupted values and return "right".

#### Scenario: Default handedness is right
- **WHEN** no handedness has been saved
- **THEN** the handedness is "right"

#### Scenario: Handedness changes persist
- **WHEN** handedness is set to "left"
- **THEN** localStorage contains "left" under the handedness key

#### Scenario: Invalid stored value self-heals
- **WHEN** localStorage contains "invalid" under the handedness key
- **THEN** the handedness is "right"
- **AND** the corrupted key is removed from localStorage

### Requirement: Synced settings localStorage cache

Synced settings (default_box, accent_color, custom accent colors, day_boundary) SHALL be cached in localStorage via `LocalPreferencesService.syncCache()`. Cache SHALL be updated only after IndexedDB load. Accent color caching SHALL happen only in `ThemeProvider` (not in `useSettings`).

#### Scenario: Cached default box provides instant value
- **WHEN** localStorage has "today" cached for default box
- **AND** the settings hook initializes
- **THEN** the initial value is "today" (before IndexedDB loads)

#### Scenario: Invalid cached value self-heals
- **WHEN** localStorage has "invalid_box" cached for default box
- **AND** the settings hook initializes
- **THEN** the initial value falls back to "inbox"
- **AND** the corrupted key is removed from localStorage

#### Scenario: Cache updated after IndexedDB load
- **WHEN** localStorage has "inbox" cached but IndexedDB has "week" for default box
- **AND** the settings hook loads from IndexedDB
- **THEN** localStorage cache is updated to "week"

#### Scenario: Accent color cache written only by ThemeProvider
- **WHEN** accent color is loaded from IndexedDB
- **THEN** only `ThemeProvider` calls `syncCache` for accent_color
- **AND** `useSettings` does NOT write accent_color to localStorage

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
