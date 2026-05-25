## ADDED Requirements

### Requirement: Read setting by key

The system SHALL provide a method to retrieve a single setting by its key. If the key does not exist, the system SHALL return `undefined`.

#### Scenario: Get existing setting by key
- **WHEN** a setting with key "accent_color" and value "blue" exists in the database
- **THEN** `getByKey("accent_color")` returns the full setting record with key, value, updated_at, and needsSync

#### Scenario: Get value of existing setting
- **WHEN** a setting with key "default_box" and value "today" exists
- **THEN** `getValue("default_box")` returns "today"

#### Scenario: Get non-existent setting
- **WHEN** no setting with key "unknown_key" exists
- **THEN** `getByKey("unknown_key")` returns `undefined`

#### Scenario: Get value of non-existent setting
- **WHEN** no setting with key "unknown_key" exists
- **THEN** `getValue("unknown_key")` returns `undefined`

### Requirement: List all settings

The system SHALL provide a method to retrieve all stored settings as an array.

#### Scenario: Get all settings from populated store
- **WHEN** three settings exist in the database
- **THEN** `getAll()` returns an array of three setting records

#### Scenario: Get all settings from empty store
- **WHEN** no settings exist in the database
- **THEN** `getAll()` returns an empty array

### Requirement: Set setting with idempotency

The system SHALL create or update a setting by key. When the value has not changed, the system SHALL skip the write (idempotent). When the value changes, the system SHALL update `updated_at` to the current timestamp and set `needsSync` to `true`.

#### Scenario: Create new setting
- **WHEN** `set("accent_color", "blue")` is called and no setting with that key exists
- **THEN** a new setting is created with key "accent_color", value "blue", needsSync `true`, and a current `updated_at` timestamp

#### Scenario: Update existing setting with different value
- **WHEN** a setting with key "accent_color" and value "green" exists
- **AND** `set("accent_color", "blue")` is called
- **THEN** the setting value is updated to "blue", needsSync is set to `true`, and updated_at is refreshed

#### Scenario: Skip write when value unchanged
- **WHEN** a setting with key "accent_color" and value "blue" exists
- **AND** `set("accent_color", "blue")` is called
- **THEN** no write occurs and the original `updated_at` is preserved

#### Scenario: Reject invalid setting data
- **WHEN** `set` is called with data that fails Zod schema validation
- **THEN** an error is thrown with message containing "Invalid setting data"

### Requirement: Track settings needing sync

The system SHALL provide a method to retrieve all settings where `needsSync` is `true`, and a method to clear the sync flag for specified keys.

#### Scenario: Get settings needing sync
- **WHEN** two settings have `needsSync: true` and one has `needsSync: false`
- **THEN** `getNeedingSync()` returns only the two settings with `needsSync: true`

#### Scenario: Clear sync flag by keys
- **WHEN** settings "accent_color" and "default_box" have `needsSync: true`
- **AND** `clearNeedsSyncByKey(["accent_color"])` is called
- **THEN** "accent_color" has `needsSync: false` and "default_box" still has `needsSync: true`

### Requirement: Get settings changed since timestamp

The system SHALL provide a method to retrieve settings with `updated_at` strictly greater than a given timestamp.

#### Scenario: Filter settings by updated_at
- **WHEN** setting A has `updated_at: "2025-01-01T00:00:00.000Z"` and setting B has `updated_at: "2025-01-02T00:00:00.000Z"`
- **AND** `getChangedSince("2025-01-01T00:00:00.000Z")` is called
- **THEN** only setting B is returned

### Requirement: Bulk upsert with conflict resolution

The system SHALL accept an array of server settings and apply them with conflict resolution: (1) skip if local setting has `needsSync: true` (local dirty wins), (2) skip if server `updated_at` is not newer than local, (3) accept and overwrite otherwise with `needsSync: false`.

#### Scenario: Accept newer server setting
- **WHEN** local setting has key "accent_color", value "green", `updated_at: "2025-01-01T00:00:00.000Z"`, `needsSync: false`
- **AND** server sends key "accent_color", value "blue", `updated_at: "2025-01-02T00:00:00.000Z"`
- **THEN** local setting is updated to value "blue" with `needsSync: false`

#### Scenario: Skip server setting when local is dirty
- **WHEN** local setting has key "accent_color", value "coral", `needsSync: true`
- **AND** server sends key "accent_color", value "blue", `updated_at: "2025-12-31T00:00:00.000Z"`
- **THEN** local setting remains value "coral" with `needsSync: true`

#### Scenario: Skip server setting when not newer
- **WHEN** local setting has key "accent_color", value "green", `updated_at: "2025-01-02T00:00:00.000Z"`, `needsSync: false`
- **AND** server sends key "accent_color", value "blue", `updated_at: "2025-01-01T00:00:00.000Z"`
- **THEN** local setting remains value "green"

#### Scenario: Insert new setting from server
- **WHEN** no local setting with key "default_box" exists
- **AND** server sends key "default_box", value "today", `updated_at: "2025-01-01T00:00:00.000Z"`
- **THEN** a new local setting is created with value "today" and `needsSync: false`

#### Scenario: Skip empty bulk upsert
- **WHEN** `bulkUpsert([])` is called
- **THEN** no database operations are performed

### Requirement: Custom accent color persistence

When accent color is set to "custom", the system SHALL store two additional synced settings: `custom_accent_light` (hex color for light theme) and `custom_accent_dark` (hex color for dark theme). These settings are stored in IndexedDB with `needsSync: true` and cached in localStorage. Default values SHALL be "#fcd34d" (light) and "#14b8a6" (dark). The `setCustomAccentColors` operation SHALL write both hex values to the repository and update localStorage cache atomically.

#### Scenario: Save custom accent colors
- **WHEN** `setCustomAccentColors("#ff0000", "#00ff00")` is called
- **THEN** `custom_accent_light` is set to "#ff0000" and `custom_accent_dark` is set to "#00ff00" in the repository with `needsSync: true`
- **AND** both values are cached in localStorage

#### Scenario: Custom colors loaded from IndexedDB on init
- **WHEN** accent color is "custom" and IndexedDB has `custom_accent_light: "#abc123"` and `custom_accent_dark: "#def456"`
- **THEN** the provider loads and applies these custom colors
- **AND** localStorage cache is updated with the loaded values

#### Scenario: Default custom colors when not stored
- **WHEN** accent color is "custom" but no custom color settings exist in IndexedDB or localStorage
- **THEN** the system uses default values "#fcd34d" (light) and "#14b8a6" (dark)

#### Scenario: Custom colors synced from server
- **WHEN** server sends `custom_accent_light` and `custom_accent_dark` via bulk upsert
- **THEN** conflict resolution rules apply (same as other synced settings)
- **AND** the custom colors are available after next provider reload

#### Scenario: Custom colors only applied when accent is custom
- **WHEN** `setCustomAccentColors` is called but accent color is not "custom"
- **THEN** the hex values are persisted but NOT applied to the DOM

### Requirement: Service provides typed defaults

The `SettingsService` SHALL provide typed accessors for known settings with default fallbacks: `getDefaultBox()` returns `BOX.INBOX` when unset, `getAccentColor()` returns `DEFAULT_ACCENT_COLOR` ("green") when unset.

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

#### Scenario: Service delegates set to repository
- **WHEN** `service.set("accent_color", "blue")` is called
- **THEN** the repository's `set("accent_color", "blue")` is invoked
