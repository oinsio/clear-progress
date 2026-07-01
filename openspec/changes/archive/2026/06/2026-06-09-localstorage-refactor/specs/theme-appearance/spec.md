## ADDED Requirements

### Requirement: Early color scheme application in index.html

The `index.html` inline script SHALL read `color_scheme` from localStorage and apply the `dark` class to `document.documentElement` before React loads. When `color_scheme` is `"dark"`, the `dark` class SHALL be added. When `color_scheme` is `"light"`, no class SHALL be added. When `color_scheme` is `"system"` or absent, the script SHALL check `window.matchMedia("(prefers-color-scheme: dark)")` and add the `dark` class if the system prefers dark.  # implements FR14, FR15 of localstorage-refactor

#### Scenario: Apply dark class for stored dark scheme
- **WHEN** localStorage has `"dark"` for `color_scheme`
- **THEN** `document.documentElement` has the `"dark"` class before React mounts

#### Scenario: No dark class for stored light scheme
- **WHEN** localStorage has `"light"` for `color_scheme`
- **THEN** `document.documentElement` does NOT have the `"dark"` class before React mounts

#### Scenario: System scheme with dark OS preference
- **WHEN** localStorage has `"system"` for `color_scheme` and OS prefers dark
- **THEN** `document.documentElement` has the `"dark"` class before React mounts

#### Scenario: System scheme with light OS preference
- **WHEN** localStorage has `"system"` for `color_scheme` and OS prefers light
- **THEN** `document.documentElement` does NOT have the `"dark"` class before React mounts

#### Scenario: Missing color_scheme treated as system
- **WHEN** localStorage has no `color_scheme` entry
- **THEN** the script checks OS preference and applies `"dark"` class accordingly

## MODIFIED Requirements

### Requirement: Accent color initialization from localStorage

The system SHALL read the initial accent color from localStorage using `LocalPreferencesService.getPreference()`. If the cached value is a valid accent color, it SHALL be used. If missing or invalid, the system SHALL fall back to `DEFAULT_ACCENT_COLOR` ("green"). Self-healing SHALL remove corrupted values. Accent color caching in localStorage SHALL happen only in `ThemeProvider` (the duplicate caching in `useSettings` SHALL be removed).  # implements FR20 of localstorage-refactor

#### Scenario: Initialize from cached accent color
- **WHEN** localStorage has "purple" stored for accent color
- **THEN** the initial accent color is "purple"

#### Scenario: Initialize with missing accent cache
- **WHEN** localStorage has no accent color stored
- **THEN** the initial accent color is "green"

#### Scenario: Initialize with invalid accent cache and self-heal
- **WHEN** localStorage has "neon" stored for accent color
- **THEN** the initial accent color is "green"
- **AND** the corrupted key is removed from localStorage

#### Scenario: Only ThemeProvider writes accent color cache
- **WHEN** accent color is loaded from IndexedDB during `useSettings` loadSettings
- **THEN** `useSettings` does NOT write `STORAGE_KEYS.ACCENT_COLOR` to localStorage
- **AND** `ThemeProvider` writes it after its own IndexedDB load

### Requirement: Color scheme initialization from localStorage

The system SHALL read the initial color scheme from localStorage using `LocalPreferencesService.getPreference()` with type `"enum"`. If the cached value is a valid color scheme ("system", "light", "dark"), it SHALL be used. If the value is missing or invalid, the system SHALL fall back to "system". Self-healing SHALL remove corrupted values.  # implements FR1, FR8 of theme-appearance-spec

#### Scenario: Initialize from cached color scheme
- **WHEN** localStorage has "dark" stored for color scheme
- **THEN** the initial color scheme is "dark"

#### Scenario: Initialize with missing cache
- **WHEN** localStorage has no color scheme stored
- **THEN** the initial color scheme is "system"

#### Scenario: Initialize with invalid cache and self-heal
- **WHEN** localStorage has "invalid_scheme" stored for color scheme
- **THEN** the initial color scheme is "system"
- **AND** the corrupted key is removed from localStorage
