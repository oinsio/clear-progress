## MODIFIED Requirements

### Requirement: Service provides typed defaults

The `SettingsService` SHALL provide typed accessors for known settings with default fallbacks: `getDefaultBox()` returns `BOX.INBOX` when unset, `getAccentColor()` returns `DEFAULT_ACCENT_COLOR` ("green") when unset, `getDayBoundary()` returns `DEFAULT_DAY_BOUNDARY` ("00:00") when unset. The service SHALL reference `STORAGE_KEYS` constants for setting keys (the separate `SETTING_KEYS` constant SHALL be removed).  # implements FR13 of localstorage-refactor

#### Scenario: Default box returns inbox when unset
- **WHEN** no setting with key "default_box" exists
- **THEN** `getDefaultBox()` returns "inbox"

#### Scenario: Default box returns stored value
- **WHEN** setting "default_box" has value "today"
- **THEN** `getDefaultBox()` returns "today"

#### Scenario: Accent color returns green when unset
- **WHEN** no setting with key "accent_color" exists
- **THEN** `getAccentColor()` returns "green"

#### Scenario: Accent color returns stored value
- **WHEN** setting "accent_color" has value "purple"
- **THEN** `getAccentColor()` returns "purple"

#### Scenario: Day boundary returns midnight when unset
- **WHEN** no setting with key "day_boundary" exists
- **THEN** `getDayBoundary()` returns "00:00"

#### Scenario: Day boundary returns stored value
- **WHEN** setting "day_boundary" has value "02:00"
- **THEN** `getDayBoundary()` returns "02:00"

#### Scenario: Day boundary self-heals invalid stored value
- **WHEN** setting "day_boundary" has value "invalid"
- **THEN** `getDayBoundary()` returns "00:00"
- **AND** the stored value is overwritten with "00:00" and marked needsSync true

#### Scenario: Service delegates set to repository
- **WHEN** `service.set("day_boundary", "02:00")` is called
- **THEN** the repository's `set("day_boundary", "02:00")` is invoked

#### Scenario: Day boundary synced via existing infrastructure
- **WHEN** day_boundary is set to "02:00" with needsSync true
- **THEN** it is included in the next push to server as a regular setting

## REMOVED Requirements

### Requirement: SETTING_KEYS constant

**Reason**: `SETTING_KEYS` duplicated 5 values from `STORAGE_KEYS` (`DEFAULT_BOX`, `ACCENT_COLOR`, `CUSTOM_ACCENT_LIGHT`, `CUSTOM_ACCENT_DARK`, `DAY_BOUNDARY`). All code SHALL use `STORAGE_KEYS.*` instead.
**Migration**: Replace all `SETTING_KEYS.*` references with `STORAGE_KEYS.*`. Remove the `SETTING_KEYS` export from `constants/index.ts`.
