## ADDED Requirements

### Requirement: Periodic sync interval preference

The system SHALL store the periodic sync interval in **minutes** as a synced setting under `STORAGE_KEYS.SYNC_INTERVAL` (`"sync_interval"`). The default value SHALL be `DEFAULT_SYNC_INTERVAL_MIN` (5, matching the current `SYNC_INTERVAL_MS` of 5 minutes). Accepted values SHALL be integers in the range `MIN_SYNC_INTERVAL_MIN` (1) to `MAX_SYNC_INTERVAL_MIN` (1440). An empty stored value SHALL mean "periodic sync disabled". The setting SHALL be added to `SYNCED_SETTING_KEYS` and cached in localStorage on write for fast start-up reads. Corrupted or out-of-range non-empty values SHALL self-heal to the default (never clamped). Self-healing SHALL be read-only with respect to the settings store: the invalid stored value SHALL NOT be rewritten or marked `needsSync`; only the invalid localStorage cache entry SHALL be removed. # implements FR1, FR5, FR6, FR7 of configurable-sync-timing

#### Scenario: Default sync interval is five minutes
- **WHEN** no sync interval has been stored
- **THEN** the effective interval is 5 minutes (300000 ms)

#### Scenario: Stored interval is used
- **WHEN** `sync_interval` is stored as "30"
- **THEN** the effective interval is 30 minutes (1800000 ms)

#### Scenario: Empty interval disables periodic sync
- **WHEN** `sync_interval` is stored as an empty string
- **THEN** periodic sync is considered disabled and no interval value is produced

#### Scenario: Out-of-range interval self-heals to default
- **WHEN** `sync_interval` is stored as "5000" (above 1440)
- **THEN** the effective interval falls back to the 5-minute default (not clamped to 1440)
- **AND** the corrupted value is removed from the localStorage cache
- **AND** the stored settings value is not rewritten and no sync is triggered by the read

#### Scenario: Non-numeric interval self-heals to default
- **WHEN** `sync_interval` is stored as "abc"
- **THEN** the effective interval falls back to the 5-minute default

#### Scenario: Interval is a synced setting
- **WHEN** `sync_interval` is written
- **THEN** it is stored in the settings repository with `needsSync` true
- **AND** its key is present in `SYNCED_SETTING_KEYS`

### Requirement: Auto sync delay preference

The system SHALL store the post-edit debounce delay in **seconds** as a synced setting under `STORAGE_KEYS.AUTO_SYNC_DELAY` (`"auto_sync_delay"`). The default value SHALL be `DEFAULT_AUTO_SYNC_DELAY_SEC` (15, matching the current `SYNC_DEBOUNCE_MS` of 15 seconds). Accepted values SHALL be integers in the range `MIN_AUTO_SYNC_DELAY_SEC` (0) to `MAX_AUTO_SYNC_DELAY_SEC` (900). A value of `0` or an empty stored value SHALL mean "sync immediately". The setting SHALL be added to `SYNCED_SETTING_KEYS` and cached in localStorage on write for fast start-up reads. Corrupted or out-of-range non-empty values SHALL self-heal to the default (never clamped). Self-healing SHALL be read-only with respect to the settings store: the invalid stored value SHALL NOT be rewritten or marked `needsSync`; only the invalid localStorage cache entry SHALL be removed. # implements FR2, FR5, FR6, FR7 of configurable-sync-timing

#### Scenario: Default auto sync delay is fifteen seconds
- **WHEN** no auto sync delay has been stored
- **THEN** the effective delay is 15 seconds (15000 ms)

#### Scenario: Stored delay is used
- **WHEN** `auto_sync_delay` is stored as "60"
- **THEN** the effective delay is 60 seconds (60000 ms)

#### Scenario: Zero delay means immediate
- **WHEN** `auto_sync_delay` is stored as "0"
- **THEN** the effective delay is 0 ms (immediate)

#### Scenario: Empty delay means immediate
- **WHEN** `auto_sync_delay` is stored as an empty string
- **THEN** the effective delay is 0 ms (immediate)

#### Scenario: Out-of-range delay self-heals to default
- **WHEN** `auto_sync_delay` is stored as "5000" (above 900)
- **THEN** the effective delay falls back to the 15-second default (not clamped to 900)
- **AND** the corrupted value is removed from the localStorage cache
- **AND** the stored settings value is not rewritten and no sync is triggered by the read

#### Scenario: Delay is a synced setting
- **WHEN** `auto_sync_delay` is written
- **THEN** it is stored in the settings repository with `needsSync` true
- **AND** its key is present in `SYNCED_SETTING_KEYS`

### Requirement: Sync-timing controls in Account & Sync section

The Account & Sync settings section SHALL provide two numeric controls for the sync-timing preferences, placed above the server connection UI, ordered periodic interval (minutes) first and auto sync delay (seconds) second. Each control SHALL display its unit, SHALL show a `SyncIndicator` bound to its setting key, and SHALL be keyboard-operable with an accessible label and help text. Inputs SHALL accept only integers within range; out-of-range or non-numeric entries SHALL revert to the last valid value on blur/Enter, while an empty value SHALL be preserved where the setting allows it. Help text SHALL communicate the disabled/immediate meaning of empty values. If persisting a committed value fails, the control SHALL revert to the last stored value and visibly indicate the failure. # implements FR8, NFR-A1, UX1, UX2, UX3, UX4, UX5 of configurable-sync-timing

#### Scenario: Both controls render above server UI
- **WHEN** the Account & Sync section is expanded
- **THEN** the interval control and the delay control are displayed above the server connection interface
- **AND** the interval control appears before the delay control

#### Scenario: Each control shows a sync indicator
- **WHEN** the Account & Sync section is expanded
- **THEN** the interval control shows a `SyncIndicator` for `sync_interval`
- **AND** the delay control shows a `SyncIndicator` for `auto_sync_delay`

#### Scenario: Units are shown, never milliseconds
- **WHEN** the controls are displayed
- **THEN** the interval control shows a minutes unit and the delay control shows a seconds unit
- **AND** no value is displayed in milliseconds

#### Scenario: Out-of-range entry reverts on commit
- **WHEN** the user types "9999" into the interval control and blurs
- **THEN** the control reverts to the last valid stored value

#### Scenario: Empty interval is preserved and explained
- **WHEN** the user clears the interval control and blurs
- **THEN** the empty value is preserved
- **AND** help text indicates periodic background sync is off

#### Scenario: Zero or empty delay is explained
- **WHEN** the delay control value is 0 or empty
- **THEN** help text indicates edits sync immediately

#### Scenario: Write failure reverts the input
- **WHEN** the user commits a new value and persisting it fails
- **THEN** the control reverts to the last stored value
- **AND** the failure is visibly indicated
- **AND** sync keeps running on the previous timing
