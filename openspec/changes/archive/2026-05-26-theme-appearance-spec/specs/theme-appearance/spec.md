## ADDED Requirements

### Requirement: Color scheme switching

The system SHALL support three color scheme modes: "light", "dark", and "system". When set to "light", the `dark` class SHALL be removed from `document.documentElement`. When set to "dark", the `dark` class SHALL be added. When set to "system", the system SHALL check `window.matchMedia("(prefers-color-scheme: dark)")` and apply the corresponding class. The default color scheme SHALL be "system".  # implements FR1 of theme-appearance-spec

#### Scenario: Apply light color scheme
- **WHEN** color scheme is set to "light"
- **THEN** `document.documentElement` does not have the "dark" class

#### Scenario: Apply dark color scheme
- **WHEN** color scheme is set to "dark"
- **THEN** `document.documentElement` has the "dark" class

#### Scenario: Apply system color scheme with dark preference
- **WHEN** color scheme is set to "system" and system prefers dark
- **THEN** `document.documentElement` has the "dark" class

#### Scenario: Apply system color scheme with light preference
- **WHEN** color scheme is set to "system" and system prefers light
- **THEN** `document.documentElement` does not have the "dark" class

### Requirement: Color scheme initialization from localStorage

The system SHALL read the initial color scheme from localStorage under the `STORAGE_KEYS.COLOR_SCHEME` key. If the cached value is a valid color scheme ("system", "light", "dark"), it SHALL be used. If the value is missing or invalid, the system SHALL fall back to "system".  # implements FR1, FR8 of theme-appearance-spec

#### Scenario: Initialize from cached color scheme
- **WHEN** localStorage has "dark" stored for color scheme
- **THEN** the initial color scheme is "dark"

#### Scenario: Initialize with missing cache
- **WHEN** localStorage has no color scheme stored
- **THEN** the initial color scheme is "system"

#### Scenario: Initialize with invalid cache
- **WHEN** localStorage has "invalid_scheme" stored for color scheme
- **THEN** the initial color scheme is "system"

### Requirement: System theme change detection

The system SHALL listen for changes to the `prefers-color-scheme` media query. When the color scheme is "system" and the OS preference changes, the system SHALL re-apply the color scheme and re-apply the accent color for the new mode.  # implements FR2 of theme-appearance-spec

#### Scenario: System switches from light to dark while in system mode
- **WHEN** color scheme is "system" and OS switches to dark mode
- **THEN** the "dark" class is added to `document.documentElement`
- **AND** accent color is re-applied for dark mode

#### Scenario: System theme change ignored when not in system mode
- **WHEN** color scheme is "light" and OS switches to dark mode
- **THEN** the "dark" class remains absent from `document.documentElement`

### Requirement: Accent color selection from presets

The system SHALL support 7 preset accent colors (coral, orange, yellow, green, blue, indigo, purple) plus "custom". When a preset accent color is selected, the system SHALL set the `data-accent` attribute on `document.documentElement` to the color name and remove any custom `--color-accent` CSS variable.  # implements FR3, FR5 of theme-appearance-spec

#### Scenario: Apply preset accent color
- **WHEN** accent color is set to "blue"
- **THEN** `document.documentElement` has `data-accent="blue"`
- **AND** the `--color-accent` CSS variable is not set

#### Scenario: Apply each preset accent color
- **WHEN** accent color is set to any of the 7 presets
- **THEN** `document.documentElement` has the corresponding `data-accent` attribute

### Requirement: Accent color initialization from localStorage

The system SHALL read the initial accent color from localStorage under `STORAGE_KEYS.ACCENT_COLOR`. If the cached value is a valid accent color, it SHALL be used. If missing or invalid, the system SHALL fall back to `DEFAULT_ACCENT_COLOR` ("green").  # implements FR3, FR9 of theme-appearance-spec

#### Scenario: Initialize from cached accent color
- **WHEN** localStorage has "purple" stored for accent color
- **THEN** the initial accent color is "purple"

#### Scenario: Initialize with missing accent cache
- **WHEN** localStorage has no accent color stored
- **THEN** the initial accent color is "green"

#### Scenario: Initialize with invalid accent cache
- **WHEN** localStorage has "neon" stored for accent color
- **THEN** the initial accent color is "green"

### Requirement: Accent color meta theme-color update

When a preset accent color is applied, the system SHALL update the `<meta name="theme-color">` tag with the appropriate hex value from `ACCENT_COLOR_VALUES` (light mode) or `ACCENT_COLOR_VALUES_DARK` (dark mode). When custom accent color is applied, the meta tag SHALL be updated with the custom hex value.  # implements FR5 of theme-appearance-spec

#### Scenario: Meta theme-color updated for preset in light mode
- **WHEN** accent color "green" is applied in light mode
- **THEN** the meta theme-color content is the light hex value for green

#### Scenario: Meta theme-color updated for preset in dark mode
- **WHEN** accent color "green" is applied in dark mode
- **THEN** the meta theme-color content is the dark hex value for green

### Requirement: Custom accent color application

When accent color is "custom", the system SHALL convert the custom hex color to RGB format using `hexToRgb` and set the `--color-accent` CSS variable on `document.documentElement`. The system SHALL use the dark hex when in dark mode and the light hex when in light mode. Default custom colors SHALL be "#fcd34d" (light) and "#14b8a6" (dark).  # implements FR4, FR10 of theme-appearance-spec

#### Scenario: Apply custom accent color in light mode
- **WHEN** accent color is "custom" with light hex "#ff5733" and mode is light
- **THEN** `--color-accent` CSS variable is set to the RGB equivalent of "#ff5733"
- **AND** `data-accent` is "custom"

#### Scenario: Apply custom accent color in dark mode
- **WHEN** accent color is "custom" with dark hex "#00ff00" and mode is dark
- **THEN** `--color-accent` CSS variable is set to the RGB equivalent of "#00ff00"

#### Scenario: Apply custom accent with default colors
- **WHEN** accent color is "custom" with no custom hex provided
- **THEN** the system uses "#fcd34d" for light mode and "#14b8a6" for dark mode

### Requirement: Interface scale switching

The system SHALL support four interface scales: "small", "normal", "large", "xLarge". When the scale is changed, the system SHALL set the `data-scale` attribute on `document.documentElement` to the scale value and persist it to localStorage under `STORAGE_KEYS.INTERFACE_SCALE`.  # implements FR6, FR11 of theme-appearance-spec

#### Scenario: Apply interface scale
- **WHEN** interface scale is set to "large"
- **THEN** `document.documentElement` has `data-scale="large"`
- **AND** localStorage contains "large" for the interface scale key

#### Scenario: Apply each interface scale value
- **WHEN** interface scale is set to any valid value
- **THEN** the corresponding `data-scale` attribute is applied

### Requirement: Interface scale initialization from localStorage

The system SHALL read the initial interface scale from localStorage. If the cached value is valid ("small", "normal", "large", "xLarge"), it SHALL be used. If missing or invalid, the system SHALL fall back to "normal".  # implements FR6, FR11 of theme-appearance-spec

#### Scenario: Initialize from cached interface scale
- **WHEN** localStorage has "large" stored for interface scale
- **THEN** the initial interface scale is "large"

#### Scenario: Initialize with missing scale cache
- **WHEN** localStorage has no interface scale stored
- **THEN** the initial interface scale is "normal"

#### Scenario: Initialize with invalid scale cache
- **WHEN** localStorage has "huge" stored for interface scale
- **THEN** the initial interface scale is "normal"

### Requirement: Hex to RGB conversion

The system SHALL provide a `hexToRgb` utility that converts a 6-character hex color string to space-separated RGB format ("r g b"). The utility SHALL accept hex strings with or without a leading `#`. Invalid hex formats SHALL throw an error.  # implements FR7, FR12 of theme-appearance-spec

#### Scenario: Convert valid hex with hash
- **WHEN** hexToRgb is called with "#ff5733"
- **THEN** the result is "255 87 51"

#### Scenario: Convert valid hex without hash
- **WHEN** hexToRgb is called with "ff5733"
- **THEN** the result is "255 87 51"

#### Scenario: Convert black
- **WHEN** hexToRgb is called with "#000000"
- **THEN** the result is "0 0 0"

#### Scenario: Convert white
- **WHEN** hexToRgb is called with "#ffffff"
- **THEN** the result is "255 255 255"

#### Scenario: Reject invalid hex format
- **WHEN** hexToRgb is called with "xyz"
- **THEN** an error is thrown with message containing "Invalid hex color format"

#### Scenario: Reject short hex format
- **WHEN** hexToRgb is called with "#fff"
- **THEN** an error is thrown with message containing "Invalid hex color format"
