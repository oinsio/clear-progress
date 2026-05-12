## ADDED Requirements

### Requirement: Push sends dirty records to server
The system SHALL collect all records with `needsSync = true` from IndexedDB and send them to the server via `push(PushRequest)`. The `needsSync` field SHALL be stripped before sending. Each entity type (tasks, goals, contexts, categories, ideas, checklist_items, settings) SHALL be sent in its corresponding field of PushRequest.

#### Scenario: Regular push collects only dirty records
- **WHEN** client has 5 tasks, 2 with `needsSync = true`
- **THEN** PushRequest contains only those 2 tasks

#### Scenario: Force push collects all records
- **WHEN** `push(force = true)` is called
- **THEN** PushRequest contains all 5 tasks regardless of `needsSync`

#### Scenario: needsSync is stripped from wire format
- **WHEN** PushRequest is sent to server
- **THEN** no record in the request contains the `needsSync` field

#### Scenario: Goals with local cover IDs are sanitized
- **WHEN** a goal has `cover_file_id` prefixed with `"local:"`
- **THEN** PushRequest sends `cover_file_id = ""` for that goal

### Requirement: Server assigns revision on push
The server SHALL assign a single `revision` number to all accepted/created records in a push batch. The `revision` is a monotonically increasing integer stored in the Meta sheet. The server SHALL increment `next_revision` under script lock.

#### Scenario: Revision assigned to created records
- **WHEN** server receives a push with 3 new tasks
- **THEN** all 3 tasks receive the same `revision` value
- **AND** `next_revision` in Meta sheet is incremented by 1

#### Scenario: Revision assigned atomically under lock
- **WHEN** two concurrent push requests arrive
- **THEN** each receives a different `revision` value (no duplicates)

### Requirement: Push result statuses
The server SHALL return a status for each pushed record: `created`, `accepted`, `conflict`, or `rejected`.

#### Scenario: New record gets status created
- **WHEN** server receives a record whose `id` does not exist on server
- **THEN** result status is `created`

#### Scenario: Updated record wins conflict by timestamp
- **WHEN** client record has `updated_at` >= server record's `updated_at`
- **THEN** result status is `accepted`

#### Scenario: Updated record loses conflict by timestamp
- **WHEN** client record has `updated_at` < server record's `updated_at`
- **THEN** result status is `conflict`
- **AND** result includes `server_record` with the server's current version

#### Scenario: Invalid record is rejected
- **WHEN** server receives a record with invalid UUID, blank name, or invalid box value
- **THEN** result status is `rejected` with `reason` describing the issue

### Requirement: Client applies push results
After receiving push results, the client SHALL apply them according to status.

#### Scenario: Created/accepted clears dirty flag if unchanged
- **WHEN** push result is `created` or `accepted`
- **AND** local record's version has not changed since push was sent
- **THEN** set `needsSync = false`

#### Scenario: Created/accepted keeps dirty flag if changed locally
- **WHEN** push result is `created` or `accepted`
- **AND** local record's version changed since push was sent (concurrent local edit)
- **THEN** keep `needsSync = true`

#### Scenario: Conflict overwrites local record
- **WHEN** push result is `conflict`
- **THEN** local record is overwritten with `server_record`
- **AND** `needsSync` is set to `false`

#### Scenario: Rejected records are kept for retry
- **WHEN** push result is `rejected`
- **THEN** local record is not changed
- **AND** `needsSync` remains `true`

### Requirement: Pull fetches server changes by revision
The client SHALL send `PullRequest` with `since_revision` (the last known revision). The server SHALL return all records with `revision > since_revision`.

#### Scenario: Incremental pull returns only new records
- **WHEN** client sends `since_revision = 5`
- **AND** server has records with revisions 1-10
- **THEN** response contains only records with revision 6-10

#### Scenario: Full pull with since_revision = 0
- **WHEN** client sends `since_revision = 0`
- **THEN** response contains all records on server

#### Scenario: Pull response includes current_revision
- **WHEN** pull completes
- **THEN** response contains `current_revision` = (`next_revision - 1` on server)
- **AND** client updates `last_known_revision` to this value

### Requirement: Pull protects local dirty records
When applying server records from pull, the client SHALL NOT overwrite records that have `needsSync = true`.

#### Scenario: Clean local record is overwritten by server
- **WHEN** pull returns a record that exists locally with `needsSync = false`
- **THEN** local record is overwritten with server version

#### Scenario: Dirty local record is preserved
- **WHEN** pull returns a record that exists locally with `needsSync = true`
- **THEN** local record is NOT overwritten (will be pushed in next sync)

#### Scenario: New server record is inserted
- **WHEN** pull returns a record that does not exist locally
- **THEN** record is inserted into IndexedDB

### Requirement: Dirty flag lifecycle
The `needsSync` flag SHALL be set to `true` only when entity data actually changes. The system SHALL compare field values using `hasEntityChanged()`, ignoring `id`, `version`, `updated_at`, `created_at`, `needsSync`, `revision`. Empty values (`""`, `undefined`, `null`) SHALL be treated as equal.

#### Scenario: Real change sets dirty flag
- **WHEN** user changes task name from "Buy milk" to "Buy bread"
- **THEN** `needsSync` is set to `true`

#### Scenario: No-op change does not set dirty flag
- **WHEN** user opens edit dialog and saves without changes
- **THEN** `needsSync` remains unchanged

#### Scenario: Empty string equals undefined in comparison
- **WHEN** field has value `""` on one side and `undefined` on the other
- **THEN** `hasEntityChanged()` treats them as equal

### Requirement: Conflict resolution uses last-write-wins by updated_at
The server SHALL resolve push conflicts by comparing `updated_at` timestamps. The record with the later (or equal) `updated_at` wins.

#### Scenario: Client wins with newer timestamp
- **WHEN** client sends record with `updated_at = "2025-06-01T12:00:00.000Z"`
- **AND** server has same record with `updated_at = "2025-06-01T10:00:00.000Z"`
- **THEN** client record is accepted

#### Scenario: Server wins with newer timestamp
- **WHEN** client sends record with `updated_at = "2025-06-01T10:00:00.000Z"`
- **AND** server has same record with `updated_at = "2025-06-01T12:00:00.000Z"`
- **THEN** server record wins, status = `conflict`

#### Scenario: Equal timestamps — client wins
- **WHEN** client and server have the same `updated_at`
- **THEN** client record is accepted (>= comparison)

### Requirement: Soft delete marks records without removing
Deleting a record SHALL set `is_deleted = true` and increment `version`. The record SHALL be pushed to the server with the delete flag. No physical deletion occurs until purge.

#### Scenario: Delete sets flag and syncs
- **WHEN** user deletes a task
- **THEN** task has `is_deleted = true`, `needsSync = true`, version incremented

#### Scenario: Deleted records are included in push
- **WHEN** push collects dirty records
- **THEN** records with `is_deleted = true` and `needsSync = true` are included

### Requirement: Purge hard-deletes soft-deleted records
The `purge()` operation SHALL hard-delete all records with `is_deleted = true` from the server and increment `purge_revision`.

#### Scenario: Server purge removes soft-deleted records
- **WHEN** `purge()` is called
- **THEN** server removes all records where `is_deleted = true`
- **AND** returns counts per entity type and new `purge_revision`

#### Scenario: Client detects server purge via pull
- **WHEN** pull response has `purge_revision` > client's `last_known_purge_revision`
- **THEN** client hard-deletes all local records with `is_deleted = true`
- **AND** updates `last_known_purge_revision`

#### Scenario: Client purge removes local soft-deleted records
- **WHEN** client calls `purge()`
- **THEN** after server purge completes, client hard-deletes local `is_deleted = true` records
- **AND** pulls to sync state

### Requirement: Settings sync uses timestamp filtering
Settings SHALL NOT use revision-based tracking. Instead, the client sends `settings_updated_at` in PullRequest. The server returns only settings with `updated_at` > this timestamp.

#### Scenario: Incremental settings pull
- **WHEN** client sends `settings_updated_at = "2025-06-01T10:00:00.000Z"`
- **THEN** server returns only settings updated after that timestamp

#### Scenario: Settings conflict resolution
- **WHEN** client pushes a setting with `updated_at` < server's `updated_at`
- **THEN** server returns conflict with `server_record`

### Requirement: Reset and pull overwrites all local state
The `resetAndPull()` operation SHALL reset `last_known_revision` to 0, clear `settings_updated_at`, mark all local records as `needsSync = false`, and then pull the full server state.

#### Scenario: Reset and pull sequence
- **WHEN** `resetAndPull()` is called
- **THEN** `last_known_revision` is set to 0
- **AND** all local records have `needsSync = false`
- **AND** `pull(since_revision = 0)` fetches all server records
- **AND** all local records are overwritten (since needsSync was cleared)

### Requirement: Init and ping lifecycle
The `ping()` operation SHALL return server health status without authentication. The `init()` operation SHALL create the backend data structure (sheets, folders) and be idempotent.

#### Scenario: Ping returns server status
- **WHEN** `ping()` is called (no auth required)
- **THEN** response includes `ok`, `app`, `version`, `initialized`

#### Scenario: Ping before init shows uninitialized
- **WHEN** `ping()` is called before `init()`
- **THEN** `initialized = false`

#### Scenario: Init creates backend structure
- **WHEN** `init()` is called for the first time
- **THEN** Google Sheets document, entity sheets, Drive folders are created
- **AND** Meta sheet has `next_revision = 1`, `purge_revision = 0`

#### Scenario: Init is idempotent
- **WHEN** `init()` is called multiple times
- **THEN** no error occurs and existing data is preserved

### Requirement: Revision tracking persisted in IndexedDB
The client SHALL persist `last_known_revision` and `last_known_purge_revision` in the `sync_meta` table (key-value store in IndexedDB).

#### Scenario: Revision updated after pull
- **WHEN** pull response has `current_revision = 15`
- **THEN** `last_known_revision` is set to 15

#### Scenario: Revision updated after push
- **WHEN** push response has `revision = 16`
- **THEN** `last_known_revision` is set to 16

#### Scenario: Purge revision updated after pull detects purge
- **WHEN** pull response has `purge_revision = 3` and local is 2
- **THEN** `last_known_purge_revision` is set to 3

### Requirement: Server validates push records
The server SHALL validate each record in a push request before processing.

#### Scenario: UUID validation
- **WHEN** record has invalid UUID format for `id`
- **THEN** status is `rejected` with reason

#### Scenario: Name validation
- **WHEN** task or goal has blank `name`
- **THEN** status is `rejected` with reason

#### Scenario: Box validation
- **WHEN** task has `box` value not in ("inbox", "today", "week", "later")
- **THEN** status is `rejected` with reason

### Requirement: Chunked push for large batches
When the number of records to push exceeds the chunk size limit (200 records), the client SHALL split the push into sequential chunk requests. Each chunk is sent as a separate `push()` call. This prevents GAS execution timeout (6-minute limit).

#### Scenario: Push splits into chunks when exceeding limit
- **WHEN** client has 450 dirty records to push
- **THEN** client sends 3 sequential push requests: 200, 200, 50
- **AND** each request is processed independently by the server

#### Scenario: Push within limit sends single request
- **WHEN** client has 150 dirty records to push
- **THEN** client sends a single push request with all 150 records

#### Scenario: Chunk failure stops remaining chunks
- **WHEN** chunk 2 of 3 fails with a network error
- **THEN** remaining chunks are not sent
- **AND** records from failed and unsent chunks retain `needsSync = true`

### Requirement: Lock timeout on push
The server SHALL acquire a script lock before processing a push to ensure atomicity. If the lock cannot be acquired within the timeout period (30 seconds), the server SHALL return `SYNC_LOCK_TIMEOUT` error.

#### Scenario: Lock acquired successfully
- **WHEN** push request arrives and no other push is in progress
- **THEN** lock is acquired and push proceeds normally

#### Scenario: Lock timeout returns error
- **WHEN** push request arrives but another push holds the lock for >30 seconds
- **THEN** server returns `{ ok: false, error: "SYNC_LOCK_TIMEOUT" }`

#### Scenario: Client retries after lock timeout
- **WHEN** client receives `SYNC_LOCK_TIMEOUT` error
- **THEN** client SHALL retry the push on the next sync cycle
- **AND** dirty records remain with `needsSync = true`

### Requirement: Reorder optimization for dirty flag
The `reorderTasks()`, `reorderGoals()`, and similar reorder methods SHALL compare each record's new `sort_order` with its current value. Only records with actually changed `sort_order` SHALL be marked as `needsSync = true`. If no `sort_order` values changed, the operation SHALL exit without any writes.

#### Scenario: Reorder with actual changes marks only changed records
- **WHEN** user reorders 5 tasks, but only 3 have different `sort_order`
- **THEN** only those 3 tasks have `needsSync = true`
- **AND** the other 2 tasks are not modified

#### Scenario: Reorder with no actual changes is a no-op
- **WHEN** user triggers a reorder but all `sort_order` values remain the same
- **THEN** no records are written to IndexedDB
- **AND** no records are marked as `needsSync = true`

### Requirement: Settings no-op optimization
`SettingsRepository.set()` SHALL compare the new value with the existing value before writing. If the value is unchanged, no write occurs and no `needsSync` flag is set.

#### Scenario: Setting changed value triggers write and sync
- **WHEN** `set("default_box", "inbox")` is called and current value is `"today"`
- **THEN** value is updated in IndexedDB
- **AND** `needsSync` is set to `true`

#### Scenario: Setting same value is a no-op
- **WHEN** `set("default_box", "inbox")` is called and current value is already `"inbox"`
- **THEN** no `put()` call is made
- **AND** `needsSync` is NOT set
