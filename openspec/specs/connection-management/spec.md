## ADDED Requirements

### Requirement: Connect to a backend

The system SHALL save a connection configuration to localStorage with `isActive: true` when the user connects to a backend. The system SHALL dispatch a `BACKEND_CONNECTION_EVENT` after saving. If the backend type is "gas" and a `clientId` is provided, the system SHALL additionally dispatch a `GOOGLE_CLIENT_ID_CHANGED_EVENT`.

#### Scenario: Connect saves config with isActive true  # implements FR1 of connection-management-spec
- **WHEN** `connect()` is called with a GAS config (url, clientId)
- **THEN** the config is saved to localStorage with `isActive: true`

#### Scenario: Connect overwrites isActive false to true  # implements FR1 of connection-management-spec
- **WHEN** `connect()` is called with a config that has `isActive: false`
- **THEN** the saved config has `isActive: true` regardless of the input value

#### Scenario: Connect dispatches backend connection event  # implements FR1 of connection-management-spec
- **WHEN** `connect()` is called with any valid config
- **THEN** a `BACKEND_CONNECTION_EVENT` is dispatched on window

#### Scenario: Connect dispatches Google client ID event for GAS with clientId  # implements FR1 of connection-management-spec
- **WHEN** `connect()` is called with a GAS config that includes a clientId
- **THEN** a `GOOGLE_CLIENT_ID_CHANGED_EVENT` is dispatched on window

#### Scenario: Connect does not dispatch Google client ID event for GAS without clientId  # implements FR1 of connection-management-spec
- **WHEN** `connect()` is called with a GAS config without a clientId
- **THEN** a `GOOGLE_CLIENT_ID_CHANGED_EVENT` is NOT dispatched

### Requirement: Disconnect from a backend

The system SHALL deactivate the current connection by setting `isActive: false` on the stored config (preserving URL and other fields). The system SHALL remove auth keys (`ACCESS_TOKEN`, `ACCESS_TOKEN_EXPIRES_AT`, `USER_PICTURE`) and sync keys (`LAST_SYNC`, `SETTINGS_UPDATED_AT`) from localStorage. The system SHALL dispatch both `BACKEND_CONNECTION_EVENT` and `GOOGLE_CLIENT_ID_CHANGED_EVENT`.

#### Scenario: Disconnect sets isActive to false  # implements FR2 of connection-management-spec
- **WHEN** an active connection config exists and `disconnect()` is called
- **THEN** the config remains in localStorage with `isActive: false` and all other fields preserved

#### Scenario: Disconnect removes auth and sync keys  # implements FR2 of connection-management-spec
- **WHEN** auth tokens and sync timestamps exist in localStorage and `disconnect()` is called
- **THEN** `ACCESS_TOKEN`, `ACCESS_TOKEN_EXPIRES_AT`, `USER_PICTURE`, `LAST_SYNC`, and `SETTINGS_UPDATED_AT` are removed

#### Scenario: Disconnect handles missing config gracefully  # implements FR2 of connection-management-spec
- **WHEN** no connection config exists in localStorage and `disconnect()` is called
- **THEN** no error is thrown

#### Scenario: Disconnect dispatches events  # implements FR2 of connection-management-spec
- **WHEN** `disconnect()` is called
- **THEN** both `BACKEND_CONNECTION_EVENT` and `GOOGLE_CLIENT_ID_CHANGED_EVENT` are dispatched

### Requirement: Get active connection config

The system SHALL retrieve the connection config from localStorage and return it only if `isActive` is `true`. The system SHALL validate the config against `ConnectionConfigSchema` (Zod). If the config is missing, invalid, or inactive, the system SHALL return `null`.

#### Scenario: Return active config  # implements FR3 of connection-management-spec
- **WHEN** a valid config with `isActive: true` exists in localStorage
- **THEN** `getConnectionConfig()` returns the parsed config

#### Scenario: Return null for inactive config  # implements FR3 of connection-management-spec
- **WHEN** a valid config with `isActive: false` exists in localStorage
- **THEN** `getConnectionConfig()` returns `null`

#### Scenario: Return null for missing config  # implements FR3 of connection-management-spec
- **WHEN** no config exists in localStorage
- **THEN** `getConnectionConfig()` returns `null`

#### Scenario: Return null for invalid config  # implements FR3 of connection-management-spec
- **WHEN** an invalid JSON or schema-violating config exists in localStorage
- **THEN** `getConnectionConfig()` returns `null`

### Requirement: Get saved connection config regardless of active state

The system SHALL retrieve the connection config from localStorage and return it regardless of the `isActive` flag. The system SHALL validate the config against `ConnectionConfigSchema`. If the config is missing or invalid, the system SHALL return `null`.

#### Scenario: Return config even when inactive  # implements FR4 of connection-management-spec
- **WHEN** a valid config with `isActive: false` exists in localStorage
- **THEN** `getSavedConnectionConfig()` returns the parsed config

#### Scenario: Return active config  # implements FR4 of connection-management-spec
- **WHEN** a valid config with `isActive: true` exists in localStorage
- **THEN** `getSavedConnectionConfig()` returns the parsed config

#### Scenario: Return null for missing config  # implements FR4 of connection-management-spec
- **WHEN** no config exists in localStorage
- **THEN** `getSavedConnectionConfig()` returns `null`

### Requirement: Get backend type from active config

The system SHALL derive the backend type (`"gas"` or `"supabase"`) from the active connection config. If no active config exists, the system SHALL return `null`.

#### Scenario: Return gas type  # implements FR5 of connection-management-spec
- **WHEN** an active GAS config exists
- **THEN** `getBackendType()` returns `"gas"`

#### Scenario: Return supabase type  # implements FR5 of connection-management-spec
- **WHEN** an active Supabase config exists
- **THEN** `getBackendType()` returns `"supabase"`

#### Scenario: Return null when no active config  # implements FR5 of connection-management-spec
- **WHEN** no active config exists
- **THEN** `getBackendType()` returns `null`

### Requirement: Connection config schema validation

The `ConnectionConfig` type is a Zod discriminated union on the `type` field. GAS config requires `type: "gas"`, `url` (valid HTTP/HTTPS URL), `isActive` (boolean), and optional `clientId` (string). Supabase config requires `type: "supabase"`, `url` (valid HTTP/HTTPS URL), `anonKey` (non-empty string), and `isActive` (boolean).

#### Scenario: Valid GAS config passes validation  # implements FR9 of connection-management-spec
- **WHEN** a config with `type: "gas"`, valid URL, and `isActive: true` is validated
- **THEN** validation succeeds

#### Scenario: Valid Supabase config passes validation  # implements FR9 of connection-management-spec
- **WHEN** a config with `type: "supabase"`, valid URL, non-empty anonKey, and `isActive: true` is validated
- **THEN** validation succeeds

#### Scenario: Invalid URL fails validation  # implements FR9 of connection-management-spec
- **WHEN** a config with an invalid URL (e.g., "not-a-url") is validated
- **THEN** validation fails

#### Scenario: Missing required fields fail validation  # implements FR9 of connection-management-spec
- **WHEN** a config is missing required fields (e.g., no `type`)
- **THEN** validation fails

### Requirement: Connection status derivation with priority

The `useConnectionStatus` hook SHALL derive a connection status from config, auth state, and sync status using strict priority: (1) `not_configured` if no config, (2) `no_auth` if GAS backend has clientId but no access token, (3) sync status mapping (`offline`, `error`, `unauthorized`, `syncing`), (4) `synced` as default.

Note: For GAS, `no_auth` is always possible because Client ID is now required. The scenario "GAS without clientId" no longer occurs in normal flow but the hook still handles it defensively.

#### Scenario: No config returns not_configured  # implements FR7 of connection-management-spec
- **WHEN** no connection config exists
- **THEN** the connection status is `"not_configured"`

#### Scenario: GAS with clientId but no token returns no_auth  # implements FR7 of connection-management-spec
- **WHEN** a GAS config with clientId exists but no access token is present
- **THEN** the connection status is `"no_auth"`

#### Scenario: GAS without clientId and no token returns synced  # implements FR7 of connection-management-spec
- **WHEN** a GAS config without clientId exists and no access token is present
- **THEN** the connection status is `"synced"`

#### Scenario: Sync status offline maps to offline  # implements FR7 of connection-management-spec
- **WHEN** an authenticated backend connection exists and sync status is `"offline"`
- **THEN** the connection status is `"offline"`

#### Scenario: Sync status error maps to error  # implements FR7 of connection-management-spec
- **WHEN** an authenticated backend connection exists and sync status is `"error"`
- **THEN** the connection status is `"error"`

#### Scenario: Sync status unauthorized maps to unauthorized  # implements FR7 of connection-management-spec
- **WHEN** an authenticated backend connection exists and sync status is `"unauthorized"`
- **THEN** the connection status is `"unauthorized"`

#### Scenario: Sync status syncing maps to syncing  # implements FR7 of connection-management-spec
- **WHEN** an authenticated backend connection exists and sync status is `"syncing"`
- **THEN** the connection status is `"syncing"`

#### Scenario: Default sync status maps to synced  # implements FR7 of connection-management-spec
- **WHEN** an authenticated backend connection exists and sync status is `"idle"`
- **THEN** the connection status is `"synced"`

#### Scenario: not_configured takes precedence over no_auth  # implements FR7 of connection-management-spec
- **WHEN** no config exists and no access token is present
- **THEN** the connection status is `"not_configured"` (not `"no_auth"`)

#### Scenario: no_auth takes precedence over sync error  # implements FR7 of connection-management-spec
- **WHEN** a GAS config with clientId exists, no access token, and sync status is `"error"`
- **THEN** the connection status is `"no_auth"` (not `"error"`)

### Requirement: Error status displays dedicated UI text
When connection status is `error`, the UI SHALL display the `sync.serverError` i18n key. This distinguishes server errors from network unavailability (`offline`).

#### Scenario: Error status shows "Server error" text
- **WHEN** connection status is `error`
- **THEN** the sync label displays `t("sync.serverError")`
- **AND** the text is "Ошибка сервера" (ru) or "Server error" (en)

#### Scenario: Error status shows orange indicator in settings
- **WHEN** connection status is `error`
- **THEN** the status indicator in ServerConnectedStatus is orange (`bg-orange-500`)
- **AND** the indicator is visually distinct from offline (red) and syncing (yellow)
