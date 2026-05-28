## MODIFIED Requirements

### Requirement: Connection status derivation with priority
The `useConnectionStatus` hook SHALL derive a connection status from config, auth state, and sync status using strict priority: (1) `not_configured` if no config, (2) `no_auth` if GAS backend has clientId but no access token, (3) sync status mapping (`offline`, `error`, `unauthorized`, `syncing`), (4) `synced` as default.

Note: For GAS, `no_auth` is always possible because Client ID is now required. The scenario "GAS without clientId" no longer occurs in normal flow but the hook still handles it defensively.

#### Scenario: No config returns not_configured
- **WHEN** no connection config exists
- **THEN** the connection status is `"not_configured"`

#### Scenario: GAS with clientId but no token returns no_auth
- **WHEN** a GAS config with clientId exists but no access token is present
- **THEN** the connection status is `"no_auth"`

#### Scenario: GAS without clientId and no token returns synced
- **WHEN** a GAS config without clientId exists and no access token is present
- **THEN** the connection status is `"synced"`

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

#### Scenario: not_configured takes precedence over no_auth
- **WHEN** no config exists and no access token is present
- **THEN** the connection status is `"not_configured"` (not `"no_auth"`)

#### Scenario: no_auth takes precedence over sync error
- **WHEN** a GAS config with clientId exists, no access token, and sync status is `"error"`
- **THEN** the connection status is `"no_auth"` (not `"error"`)
