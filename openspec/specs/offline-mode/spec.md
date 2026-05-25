## ADDED Requirements

### Requirement: Local-first data reads
All data reads come from IndexedDB. The UI never blocks on network availability to display data.

#### Scenario: Data is available immediately from local storage
- **WHEN** user opens the app
- **THEN** all entities (tasks, goals, ideas, contexts, categories, checklist items, settings) are loaded from IndexedDB
- **AND** no network request is required to render the UI

#### Scenario: Data remains accessible when network is unavailable
- **WHEN** navigator.onLine is false
- **THEN** all read operations return data from IndexedDB
- **AND** the UI renders normally

### Requirement: Local-first data writes
All data writes go to IndexedDB first. Network sync happens asynchronously after the write completes.

#### Scenario: Create operation succeeds without network
- **WHEN** user creates a new entity while offline
- **THEN** the entity is saved to IndexedDB with `needsSync=true`
- **AND** the UI reflects the new entity immediately

#### Scenario: Update operation succeeds without network
- **WHEN** user updates an existing entity while offline
- **THEN** the entity is updated in IndexedDB with `needsSync=true`
- **AND** the UI reflects the change immediately

#### Scenario: Delete operation succeeds without network
- **WHEN** user deletes an entity while offline
- **THEN** the entity is soft-deleted in IndexedDB (`is_deleted=true`, `needsSync=true`)
- **AND** the entity disappears from the UI immediately

### Requirement: Dirty flag persistence
Local changes marked with `needsSync=true` persist in IndexedDB until the server confirms receipt. Changes survive app restarts.

#### Scenario: Dirty records survive app restart
- **WHEN** user creates an entity while offline
- **AND** closes and reopens the app
- **THEN** the entity still exists in IndexedDB with `needsSync=true`
- **AND** will be pushed to server when connection restores

### Requirement: Connection status derivation
Connection status is derived from three inputs: backend configuration, authentication state, and sync status. Evaluation follows a strict priority order.

#### Scenario: No backend configured
- **WHEN** no backend connection config exists
- **THEN** connection status is `not_configured`
- **AND** this takes priority over any other state

#### Scenario: Backend configured but auth required
- **WHEN** backend config has a `clientId`
- **AND** no access token is present
- **THEN** connection status is `no_auth`
- **AND** this takes priority over sync status

#### Scenario: Backend configured without clientId
- **WHEN** backend config exists without `clientId`
- **AND** no access token is present
- **THEN** connection status is `synced` (not `no_auth`)

#### Scenario: Sync status mapping
- **WHEN** backend is configured and authenticated
- **THEN** connection status maps from sync status:

| Sync Status  | Connection Status |
|--------------|-------------------|
| offline      | offline           |
| error        | error             |
| unauthorized | unauthorized      |
| syncing      | syncing           |
| idle         | synced            |

#### Scenario: Priority — not_configured over no_auth
- **WHEN** no backend config exists
- **AND** no access token is present
- **THEN** connection status is `not_configured` (not `no_auth`)

#### Scenario: Priority — no_auth over sync error
- **WHEN** backend config has a `clientId`
- **AND** no access token is present
- **AND** sync status is `error`
- **THEN** connection status is `no_auth` (not `error`)

### Requirement: Offline at mount
When the browser reports no network at startup, the app sets offline status without attempting any network requests.

#### Scenario: Navigator offline at mount
- **WHEN** `navigator.onLine` is false at mount
- **THEN** sync status is set to `offline`
- **AND** no sync cycle is attempted
- **AND** ping recovery interval starts

### Requirement: Transition to offline during operation
When network becomes unavailable during normal operation, sync status transitions appropriately.

#### Scenario: Network error during sync
- **WHEN** a sync cycle fails with a network error
- **THEN** sync status becomes `error`
- **AND** ping recovery interval starts

#### Scenario: Browser fires offline event
- **WHEN** the browser fires the `offline` event
- **THEN** the app prepares for offline operation
- **AND** ping recovery monitors for reconnection

### Requirement: Offline CRUD without backend
The app is fully functional for CRUD operations even when no backend is configured.

#### Scenario: Full CRUD in not_configured state
- **WHEN** no backend connection config exists
- **THEN** user can create, read, update, and delete all entities
- **AND** all data is persisted in IndexedDB
- **AND** connection status shows `not_configured`

### Requirement: Separation of PWA caching and offline data
The PWA service worker handles asset caching (app shell, static files). Offline data availability is handled entirely by IndexedDB via Dexie. These are independent concerns: the service worker does NOT cache API responses or IndexedDB data.

#### Scenario: Service worker caches assets, not data
- **WHEN** the service worker precaches files
- **THEN** only static assets (JS, CSS, HTML, icons) are cached
- **AND** no API responses or data payloads are cached by the service worker

#### Scenario: Data availability is independent of service worker
- **WHEN** the service worker is not yet installed (first visit)
- **THEN** data reads still work via IndexedDB
- **AND** the app is functional for CRUD operations

## Relations

- **sync-orchestration**: Covers triggers, recovery, cleanup, and full sync. This spec references offline detection (T5, preconditions) but does not duplicate it.
- **sync-protocol**: Covers push/pull mechanics, dirty flag lifecycle, conflict resolution. This spec references `needsSync` behavior but does not redefine it.
- **pwa**: PWA spec covers service worker lifecycle and asset caching. This spec clarifies that data availability is handled separately via IndexedDB.
