## MODIFIED Requirements

### Requirement: Connection config storage schema

The system SHALL store all connection configurations in a single localStorage key `connection_config` as a JSON object with schema: `{ activeType: "supabase" | "gas" | null, configs: { supabase?: SupabaseConfig, gas?: GasConfig } }`. The entire structure SHALL be validated by `ConnectionStoreSchema` (Zod). Self-healing SHALL remove the corrupted key and return `null` when validation fails.  # implements FR8 of localstorage-refactor

#### Scenario: Valid connection store passes validation
- **WHEN** localStorage contains a valid JSON with `activeType: "supabase"` and `configs.supabase` with url and anonKey
- **THEN** validation succeeds and the store object is returned

#### Scenario: Empty connection store is valid
- **WHEN** localStorage contains `{ "activeType": null, "configs": {} }`
- **THEN** validation succeeds

#### Scenario: Corrupted connection store self-heals
- **WHEN** localStorage contains invalid JSON under `connection_config`
- **THEN** the key is removed from localStorage
- **AND** `console.warn` is logged
- **AND** `null` is returned

### Requirement: Connect to a backend

The system SHALL set `activeType` to the config type and upsert the type-specific config in `configs` when the user connects to a backend. Existing configs for other types SHALL be preserved. The system SHALL dispatch `BACKEND_CONNECTION_EVENT`. If the backend type is "gas" and a `clientId` is provided, the system SHALL additionally dispatch `GOOGLE_CLIENT_ID_CHANGED_EVENT`.  # implements FR9 of localstorage-refactor

#### Scenario: Connect saves supabase config with activeType
- **WHEN** `connect()` is called with a Supabase config (url, anonKey)
- **THEN** `activeType` is `"supabase"` and `configs.supabase` contains the url and anonKey

#### Scenario: Connect preserves other backend configs
- **WHEN** a GAS config exists in `configs.gas` and `connect()` is called with a Supabase config
- **THEN** `configs.gas` is still present alongside `configs.supabase`

#### Scenario: Connect dispatches backend connection event
- **WHEN** `connect()` is called with any valid config
- **THEN** a `BACKEND_CONNECTION_EVENT` is dispatched on window

#### Scenario: Connect dispatches Google client ID event for GAS with clientId
- **WHEN** `connect()` is called with a GAS config that includes a clientId
- **THEN** a `GOOGLE_CLIENT_ID_CHANGED_EVENT` is dispatched on window

### Requirement: Disconnect from a backend

The system SHALL set `activeType` to `null`, preserving all `configs` entries for form pre-fill. The system SHALL remove auth keys (`ACCESS_TOKEN`, `ACCESS_TOKEN_EXPIRES_AT`, `USER_PICTURE`) and sync keys (`LAST_SYNC`, `SETTINGS_UPDATED_AT`) from localStorage. The system SHALL dispatch both `BACKEND_CONNECTION_EVENT` and `GOOGLE_CLIENT_ID_CHANGED_EVENT`.  # implements FR10 of localstorage-refactor

#### Scenario: Disconnect sets activeType to null
- **WHEN** `activeType` is `"supabase"` and `disconnect()` is called
- **THEN** `activeType` is `null` and `configs.supabase` is still present

#### Scenario: Disconnect removes auth and sync keys
- **WHEN** auth tokens and sync timestamps exist in localStorage and `disconnect()` is called
- **THEN** `ACCESS_TOKEN`, `ACCESS_TOKEN_EXPIRES_AT`, `USER_PICTURE`, `LAST_SYNC`, and `SETTINGS_UPDATED_AT` are removed

#### Scenario: Disconnect handles missing connection store gracefully
- **WHEN** no connection store exists in localStorage and `disconnect()` is called
- **THEN** no error is thrown

#### Scenario: Disconnect dispatches events
- **WHEN** `disconnect()` is called
- **THEN** both `BACKEND_CONNECTION_EVENT` and `GOOGLE_CLIENT_ID_CHANGED_EVENT` are dispatched

### Requirement: Get active connection config

The system SHALL read the connection store, check `activeType`, and return `configs[activeType]` with `type` field injected. If `activeType` is `null`, the store is missing, or validation fails, the system SHALL return `null`.  # implements FR12 of localstorage-refactor

#### Scenario: Return active supabase config
- **WHEN** `activeType` is `"supabase"` and `configs.supabase` exists
- **THEN** `getConnectionConfig()` returns the supabase config with `type: "supabase"`

#### Scenario: Return null when activeType is null
- **WHEN** `activeType` is `null`
- **THEN** `getConnectionConfig()` returns `null`

#### Scenario: Return null for missing store
- **WHEN** no connection store exists in localStorage
- **THEN** `getConnectionConfig()` returns `null`

#### Scenario: Return null for corrupted store
- **WHEN** localStorage contains invalid JSON under `connection_config`
- **THEN** `getConnectionConfig()` returns `null`
- **AND** the corrupted key is removed (self-healing)

### Requirement: Get saved config for backend type

The system SHALL read from `configs[type]` within the single connection store JSON. If the type has no saved config, the system SHALL return `null`.  # implements FR11 of localstorage-refactor

#### Scenario: Return saved supabase config when active is gas
- **WHEN** `activeType` is `"gas"` but `configs.supabase` exists
- **THEN** `getSavedConfigForType("supabase")` returns the supabase config

#### Scenario: Return null for unsaved type
- **WHEN** `configs` does not contain a supabase entry
- **THEN** `getSavedConfigForType("supabase")` returns `null`

### Requirement: Get saved connection config regardless of active state

The system SHALL retrieve the config for the current `activeType` from the connection store, returning it regardless of whether the backend is active. If `activeType` is `null` but was previously set, the system SHALL return `null` (since there is no "current" config).

#### Scenario: Return config for current activeType
- **WHEN** `activeType` is `"supabase"` and `configs.supabase` exists
- **THEN** `getSavedConnectionConfig()` returns the supabase config

#### Scenario: Return null when activeType is null
- **WHEN** `activeType` is `null`
- **THEN** `getSavedConnectionConfig()` returns `null`

### Requirement: Get backend type from active config

The system SHALL derive the backend type from `activeType`. If `activeType` is `null`, the system SHALL return `null`.

#### Scenario: Return supabase type
- **WHEN** `activeType` is `"supabase"`
- **THEN** `getBackendType()` returns `"supabase"`

#### Scenario: Return null when no active type
- **WHEN** `activeType` is `null`
- **THEN** `getBackendType()` returns `null`

## REMOVED Requirements

### Requirement: Connection config schema validation

**Reason**: The `isActive` boolean field is replaced by the `activeType` field in the new `ConnectionStore` schema. Individual configs no longer carry `isActive`. Zod validation is now on `ConnectionStoreSchema` which validates the whole structure.
**Migration**: Use `ConnectionStoreSchema` instead of `ConnectionConfigSchema` for the localStorage stored value. The `ConnectionConfig` type returned from `getConnectionConfig()` keeps `type` field but no longer has `isActive`.
