## ADDED Requirements

### Requirement: Color scheme preference

The system SHALL store the color scheme preference ("system", "light", "dark") in localStorage under key `STORAGE_KEYS.COLOR_SCHEME`. Default value SHALL be "system".

#### Scenario: Default color scheme is system
- **WHEN** no color scheme has been saved
- **THEN** the color scheme is "system"

#### Scenario: Color scheme persists across sessions
- **WHEN** color scheme is set to "dark"
- **THEN** localStorage contains "dark" under the color scheme key

### Requirement: Panel side preference

The system SHALL store the panel side ("left", "right") in localStorage. Default value SHALL be "right".

#### Scenario: Default panel side is right
- **WHEN** no panel side has been saved
- **THEN** the panel side is "right"

#### Scenario: Panel side changes persist
- **WHEN** panel side is set to "left"
- **THEN** localStorage contains "left" under the panel side key

### Requirement: Panel open state

The system SHALL store whether the panel is open (boolean) in localStorage. The system SHALL also store the panel always-open preference (boolean) separately.

#### Scenario: Panel open state persists
- **WHEN** panel open is set to `true`
- **THEN** localStorage contains "true" under the panel open key

#### Scenario: Panel always-open state persists
- **WHEN** panel always-open is set to `true`
- **THEN** localStorage contains "true" under the panel always-open key

### Requirement: Focus mode with opacity

The system SHALL store focus mode (boolean, default `true`) and focus opacity (number, default 30) in localStorage. Opacity SHALL be parsed as a number on load, falling back to default if parsing fails.

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

#### Scenario: Invalid opacity falls back to default
- **WHEN** localStorage contains "not-a-number" under the focus opacity key
- **THEN** focus opacity is 30

### Requirement: Interface scale preference

The system SHALL store the interface scale ("small", "normal", "large", "xLarge") in localStorage. Default value SHALL be "normal".

#### Scenario: Default interface scale is normal
- **WHEN** no interface scale has been saved
- **THEN** the interface scale is "normal"

#### Scenario: Interface scale changes persist
- **WHEN** interface scale is set to "large"
- **THEN** localStorage contains "large" under the interface scale key

### Requirement: Filter bar position preference

The system SHALL store the filter bar position ("top", "bottom") in localStorage. Default value SHALL be "bottom".

#### Scenario: Default filter bar position is bottom
- **WHEN** no filter bar position has been saved
- **THEN** the filter bar position is "bottom"

#### Scenario: Filter bar position changes persist
- **WHEN** filter bar position is set to "top"
- **THEN** localStorage contains "top" under the filter bar position key

### Requirement: Section collapse state

The system SHALL store section collapse states as a JSON object (`Record<string, boolean>`) in localStorage. Each section is identified by a string key. Default state for any section SHALL be expanded (not collapsed).

#### Scenario: Section is expanded by default
- **WHEN** no collapse state has been saved for section "inbox"
- **THEN** section "inbox" is not collapsed

#### Scenario: Section collapse state persists
- **WHEN** section "inbox" is collapsed
- **THEN** localStorage contains a JSON object with "inbox" set to `true`

#### Scenario: Invalid JSON falls back to empty state
- **WHEN** localStorage contains invalid JSON under the section collapse key
- **THEN** all sections are treated as expanded

### Requirement: Language preference

The system SHALL store the language code in localStorage. Default value SHALL be "en". The system SHALL detect the browser language on first load and use it if a matching translation exists.

#### Scenario: Default language is English
- **WHEN** no language has been saved and browser language detection yields no match
- **THEN** the language is "en"

#### Scenario: Language preference persists
- **WHEN** language is set to "ru"
- **THEN** localStorage contains "ru" under the language key

### Requirement: Show hidden tasks preference

The system SHALL store whether to show hidden (future-dated) tasks as a boolean in localStorage. Default value SHALL be `false`.

#### Scenario: Hidden tasks are not shown by default
- **WHEN** no show-hidden-tasks preference has been saved
- **THEN** show hidden tasks is `false`

#### Scenario: Show hidden tasks preference persists
- **WHEN** show hidden tasks is set to `true`
- **THEN** localStorage contains "true" under the show hidden tasks key

### Requirement: Synced settings localStorage cache

Synced settings (default_box, accent_color, custom accent colors) SHALL be cached in localStorage for instant access before IndexedDB loads. The cache SHALL be updated after every IndexedDB read.

#### Scenario: Cached default box provides instant value
- **WHEN** localStorage has "today" cached for default box
- **AND** the settings hook initializes
- **THEN** the initial value is "today" (before IndexedDB loads)

#### Scenario: Invalid cached value falls back to default
- **WHEN** localStorage has "invalid_box" cached for default box
- **AND** the settings hook initializes
- **THEN** the initial value falls back to "inbox"

#### Scenario: Cache updated after IndexedDB load
- **WHEN** localStorage has "inbox" cached but IndexedDB has "week" for default box
- **AND** the settings hook loads from IndexedDB
- **THEN** localStorage cache is updated to "week"
