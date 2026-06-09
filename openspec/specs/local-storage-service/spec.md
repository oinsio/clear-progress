## Purpose

Provides a typed, validated abstraction over browser localStorage for reading, writing, and removing preferences. Includes self-healing for corrupted data, graceful degradation when localStorage is unavailable, a React hook for reactive state, contract tests for key stability, and synced settings cache access.

## Requirements

### Requirement: Typed preference reading with validation

The system SHALL provide a `getPreference(config)` function that reads a value from localStorage and validates it based on the config type. The config SHALL be a discriminated union on `type` field: `"enum"` (validates against allowed list), `"boolean"` (parses `"true"`/`"false"`), `"number"` (parseFloat + NaN check), `"json"` (Zod schema validation). The function SHALL be synchronous.  # implements FR1, FR7 of localstorage-refactor

#### Scenario: Read valid enum value
- **WHEN** localStorage contains `"left"` for key `"panel_side"` and config type is `"enum"` with values `["left", "right"]`
- **THEN** `getPreference` returns `"left"`

#### Scenario: Read valid boolean value
- **WHEN** localStorage contains `"true"` for key `"panel_open"` and config type is `"boolean"`
- **THEN** `getPreference` returns `true`

#### Scenario: Read valid number value
- **WHEN** localStorage contains `"0.6"` for key `"panel_split"` and config type is `"number"`
- **THEN** `getPreference` returns `0.6`

#### Scenario: Read valid JSON value
- **WHEN** localStorage contains `'{"inbox": true}'` for key `"section_collapse"` and config type is `"json"` with a matching Zod schema
- **THEN** `getPreference` returns the parsed object `{ inbox: true }`

#### Scenario: Return default for missing key
- **WHEN** localStorage does not contain the requested key
- **THEN** `getPreference` returns the `defaultValue` from config

### Requirement: Preference writing

The system SHALL provide a `setPreference(key, value, serialize?)` function that writes to localStorage. For non-string values, it SHALL serialize with `String()` by default or with the provided serializer (e.g., `JSON.stringify` for objects).  # implements FR2 of localstorage-refactor

#### Scenario: Write string value
- **WHEN** `setPreference("panel_side", "left")` is called
- **THEN** localStorage contains `"left"` under key `"panel_side"`

#### Scenario: Write boolean as string
- **WHEN** `setPreference("panel_open", true)` is called
- **THEN** localStorage contains `"true"` under key `"panel_open"`

#### Scenario: Write JSON with custom serializer
- **WHEN** `setPreference("section_collapse", { inbox: true }, JSON.stringify)` is called
- **THEN** localStorage contains `'{"inbox":true}'` under key `"section_collapse"`

### Requirement: Preference removal

The system SHALL provide a `removePreference(key)` function that removes a key from localStorage.  # implements FR3 of localstorage-refactor

#### Scenario: Remove existing key
- **WHEN** localStorage contains `"left"` under key `"panel_side"` and `removePreference("panel_side")` is called
- **THEN** localStorage no longer contains the key `"panel_side"`

#### Scenario: Remove non-existent key
- **WHEN** localStorage does not contain key `"panel_side"` and `removePreference("panel_side")` is called
- **THEN** no error is thrown

### Requirement: Self-healing for corrupted data

When `getPreference()` reads data that fails validation (invalid JSON, failed Zod schema, NaN for number, value not in enum list), the system SHALL remove the corrupted key from localStorage, log a `console.warn` with the key name and reason, and return the default value.  # implements FR4 of localstorage-refactor

#### Scenario: Self-heal invalid enum value
- **WHEN** localStorage contains `"invalid"` for key `"panel_side"` and config type is `"enum"` with values `["left", "right"]`
- **THEN** `getPreference` returns defaultValue `"right"`
- **AND** localStorage key `"panel_side"` is removed
- **AND** `console.warn` is called with a message containing `"panel_side"`

#### Scenario: Self-heal NaN number value
- **WHEN** localStorage contains `"not-a-number"` for key `"focus_opacity"` and config type is `"number"`
- **THEN** `getPreference` returns defaultValue `30`
- **AND** localStorage key `"focus_opacity"` is removed
- **AND** `console.warn` is called

#### Scenario: Self-heal invalid JSON
- **WHEN** localStorage contains `"not-valid-json!!!"` for key `"section_collapse"` and config type is `"json"`
- **THEN** `getPreference` returns the defaultValue
- **AND** localStorage key `"section_collapse"` is removed
- **AND** `console.warn` is called

#### Scenario: Self-heal Zod validation failure
- **WHEN** localStorage contains `'{"unknown": 123}'` for key `"menu_order"` and config type is `"json"` with a schema that rejects the value
- **THEN** `getPreference` returns the defaultValue
- **AND** localStorage key `"menu_order"` is removed
- **AND** `console.warn` is called

#### Scenario: Self-heal invalid boolean value
- **WHEN** localStorage contains `"maybe"` for key `"focus_mode"` and config type is `"boolean"`
- **THEN** `getPreference` returns the defaultValue
- **AND** localStorage key `"focus_mode"` is removed
- **AND** `console.warn` is called

### Requirement: Graceful handling when localStorage is unavailable

When localStorage throws an exception (e.g., private browsing, storage quota exceeded), `getPreference()` SHALL return the default value, `setPreference()` SHALL silently no-op, and `removePreference()` SHALL silently no-op. No errors SHALL propagate to the caller.  # implements FR5 of localstorage-refactor

#### Scenario: Get returns default when localStorage throws
- **WHEN** `localStorage.getItem` throws an error
- **THEN** `getPreference` returns the defaultValue without throwing

#### Scenario: Set silently no-ops when localStorage throws
- **WHEN** `localStorage.setItem` throws an error
- **THEN** `setPreference` completes without throwing

#### Scenario: Remove silently no-ops when localStorage throws
- **WHEN** `localStorage.removeItem` throws an error
- **THEN** `removePreference` completes without throwing

### Requirement: usePreference React hook

The system SHALL provide a `usePreference<T>(config)` React hook that returns `[value, setter]`. The initial value SHALL be read via `getPreference(config)`. The setter SHALL call `setPreference()` and update React state. The config object SHALL be the same discriminated union as `getPreference`.  # implements FR6 of localstorage-refactor

#### Scenario: Hook returns initial value from localStorage
- **WHEN** localStorage contains `"left"` for key `"panel_side"`
- **AND** `usePreference({ type: "enum", key: "panel_side", values: ["left", "right"], defaultValue: "right" })` is called
- **THEN** the returned value is `"left"`

#### Scenario: Hook setter updates state and localStorage
- **WHEN** the setter from `usePreference` is called with `"left"`
- **THEN** the hook's returned value becomes `"left"`
- **AND** localStorage contains `"left"` under the configured key

#### Scenario: Hook returns default for empty localStorage
- **WHEN** localStorage does not contain the key
- **THEN** the hook returns the `defaultValue`

### Requirement: Contract tests for STORAGE_KEYS string values

The system SHALL have contract tests that verify the string values of all `STORAGE_KEYS` entries match their expected literals. This protects `index.html` inline script (which reads `"accent_color"`, `"custom_accent_light"`, `"custom_accent_dark"`, `"color_scheme"` by string literal) and i18next detector config (which reads `"language"`).  # implements FR16 of localstorage-refactor

#### Scenario: accent_color key value is stable
- **WHEN** `STORAGE_KEYS.ACCENT_COLOR` is read
- **THEN** its value is `"accent_color"`

#### Scenario: custom_accent_light key value is stable
- **WHEN** `STORAGE_KEYS.CUSTOM_ACCENT_LIGHT` is read
- **THEN** its value is `"custom_accent_light"`

#### Scenario: custom_accent_dark key value is stable
- **WHEN** `STORAGE_KEYS.CUSTOM_ACCENT_DARK` is read
- **THEN** its value is `"custom_accent_dark"`

#### Scenario: color_scheme key value is stable
- **WHEN** `STORAGE_KEYS.COLOR_SCHEME` is read
- **THEN** its value is `"color_scheme"`

#### Scenario: language key value is stable
- **WHEN** `STORAGE_KEYS.LANGUAGE` is read
- **THEN** its value is `"language"`

#### Scenario: All STORAGE_KEYS values are covered
- **WHEN** all keys in `STORAGE_KEYS` are enumerated
- **THEN** every key has a corresponding contract test assertion

### Requirement: Synced settings cache access

The system SHALL provide `readCached(key, schema, default)` for reading synced settings from localStorage cache, and `syncCache(key, value)` for updating the cache after IndexedDB load. Both SHALL use `getPreference` and `setPreference` internally.  # implements FR18, FR19 of localstorage-refactor

#### Scenario: readCached returns cached synced setting
- **WHEN** localStorage contains `"today"` for key `"default_box"`
- **THEN** `readCached` returns `"today"`

#### Scenario: syncCache updates localStorage
- **WHEN** `syncCache("default_box", "week")` is called
- **THEN** localStorage contains `"week"` under key `"default_box"`
