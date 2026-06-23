## MODIFIED Requirements

### Requirement: Connection config storage schema

The system SHALL store all connection configurations in a single localStorage key `connection_config` as a JSON object with schema: `{ activeType: "supabase" | null, configs: { supabase?: SupabaseConfig } }`. The entire structure SHALL be validated by `ConnectionStoreSchema` (Zod). Self-healing SHALL remove the corrupted key and return `null` when validation fails.  # implements FR6 of gas-remove

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

The system SHALL set `activeType` to the config type and upsert the type-specific config in `configs` when the user connects to a backend. Existing configs for other types SHALL be preserved. The system SHALL dispatch `BACKEND_CONNECTION_EVENT`.  # implements FR4 of gas-remove

#### Scenario: Connect saves supabase config with activeType
- **WHEN** `connect()` is called with a Supabase config (url, anonKey)
- **THEN** `activeType` is `"supabase"` and `configs.supabase` contains the url and anonKey

#### Scenario: Connect dispatches backend connection event
- **WHEN** `connect()` is called with any valid config
- **THEN** a `BACKEND_CONNECTION_EVENT` is dispatched on window

### Requirement: Disconnect from a backend

The system SHALL set `activeType` to `null`, preserving all `configs` entries for form pre-fill. The system SHALL remove auth keys (`ACCESS_TOKEN`, `ACCESS_TOKEN_EXPIRES_AT`, `USER_PICTURE`) and sync keys (`LAST_SYNC`, `SETTINGS_UPDATED_AT`) from localStorage. The system SHALL dispatch `BACKEND_CONNECTION_EVENT`.  # implements FR4 of gas-remove

#### Scenario: Disconnect sets activeType to null
- **WHEN** `activeType` is `"supabase"` and `disconnect()` is called
- **THEN** `activeType` is `null` and `configs.supabase` is still present

#### Scenario: Disconnect removes auth and sync keys
- **WHEN** auth tokens and sync timestamps exist in localStorage and `disconnect()` is called
- **THEN** `ACCESS_TOKEN`, `ACCESS_TOKEN_EXPIRES_AT`, `USER_PICTURE`, `LAST_SYNC`, and `SETTINGS_UPDATED_AT` are removed

#### Scenario: Disconnect handles missing connection store gracefully
- **WHEN** no connection store exists in localStorage and `disconnect()` is called
- **THEN** no error is thrown

#### Scenario: Disconnect dispatches event
- **WHEN** `disconnect()` is called
- **THEN** `BACKEND_CONNECTION_EVENT` is dispatched

### Requirement: Connection status derivation with priority

The `useConnectionStatus` hook SHALL derive a connection status from config, auth state, and sync status using strict priority: (1) `not_configured` if no config, (2) sync status mapping (`offline`, `error`, `unauthorized`, `syncing`), (3) `synced` as default.  # implements FR11 of gas-remove

#### Scenario: No config returns not_configured
- **WHEN** no connection config exists
- **THEN** the connection status is `"not_configured"`

#### Scenario: Sync status offline maps to offline
- **WHEN** an authenticated backend connection exists and sync status is `"offline"`
- **THEN** the connection status is `"offline"`

#### Scenario: Sync status error maps to error
- **WHEN** an authenticated backend connection exists and sync status is `"error"`
- **THEN** the connection status is `"error"`

#### Scenario: Sync status unauthorized maps to unauthorized
- **WHEN** an authenticated backend connection exists and sync status is `"unauthorized"`
- **THEN** the connection status is `"unauthorized"`

#### Scenario: Sync status syncing maps to syncing
- **WHEN** an authenticated backend connection exists and sync status is `"syncing"`
- **THEN** the connection status is `"syncing"`

#### Scenario: Default sync status maps to synced
- **WHEN** an authenticated backend connection exists and sync status is `"idle"`
- **THEN** the connection status is `"synced"`

#### Scenario: not_configured takes precedence over sync error
- **WHEN** no config exists and sync status is `"error"`
- **THEN** the connection status is `"not_configured"` (not `"error"`)

## REMOVED Requirements

### Requirement: Connect dispatches Google client ID event for GAS with clientId
**Reason**: GAS backend removed. `GOOGLE_CLIENT_ID_CHANGED_EVENT` no longer exists.
**Migration**: None needed.

### Requirement: Connect preserves other backend configs (GAS scenario)
**Reason**: GAS backend removed. Only Supabase configs exist.
**Migration**: None needed — ConnectionStore structure still supports future backends.

### Requirement: Disconnect dispatches GOOGLE_CLIENT_ID_CHANGED_EVENT
**Reason**: GAS backend removed.
**Migration**: Disconnect dispatches only `BACKEND_CONNECTION_EVENT`.

### Requirement: GAS no_auth status derivation
**Reason**: GAS backend removed. The `no_auth` status for GAS clientId without token is no longer needed.
**Migration**: None needed — Supabase auth is handled by SDK session.
