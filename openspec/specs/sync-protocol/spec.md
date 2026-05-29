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
- **AND** local record's `updated_at` has not changed since push was sent
- **THEN** set `needsSync = false`

#### Scenario: Created/accepted keeps dirty flag if changed locally
- **WHEN** push result is `created` or `accepted`
- **AND** local record's `updated_at` changed since push was sent (concurrent local edit)
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
The `needsSync` flag SHALL be set to `true` only when entity data actually changes. The system SHALL compare field values using `hasEntityChanged()`, ignoring `id`, `updated_at`, `created_at`, `needsSync`, `revision`. Empty values (`""`, `undefined`, `null`) SHALL be treated as equal.

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
Deleting a record SHALL set `is_deleted = true`. The record SHALL be pushed to the server with the delete flag. No physical deletion occurs until purge.

#### Scenario: Delete sets flag and syncs
- **WHEN** user deletes a task
- **THEN** task has `is_deleted = true`, `needsSync = true`

#### Scenario: Deleted records are included in push
- **WHEN** push collects dirty records
- **THEN** records with `is_deleted = true` and `needsSync = true` are included

### Requirement: Purge hard-deletes soft-deleted records
The `purge()` operation SHALL hard-delete all records with `is_deleted = true` from the server and increment `purge_revision`. Server-side validation, response structure, and deletion behavior are specified in the `purge` capability spec (`openspec/specs/purge/spec.md`).

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

### Requirement: Cascading soft-delete for checklist items
When a task is soft-deleted, the system SHALL also soft-delete all checklist_items belonging to that task. Each cascaded checklist_item SHALL have `is_deleted = true`, `needsSync = true`, and `updated_at` set to the current timestamp.

#### Scenario: Soft-delete task cascades to its checklist items
- **WHEN** user soft-deletes task T1 which has checklist items C1 and C2
- **THEN** T1 has `is_deleted = true`, `needsSync = true`
- **AND** C1 has `is_deleted = true`, `needsSync = true`
- **AND** C2 has `is_deleted = true`, `needsSync = true`

#### Scenario: Soft-delete task with no checklist items
- **WHEN** user soft-deletes task T1 which has no checklist items
- **THEN** only T1 has `is_deleted = true`
- **AND** no error occurs

#### Scenario: Soft-delete task with already-deleted checklist items
- **WHEN** user soft-deletes task T1 which has C1 (`is_deleted = false`) and C2 (`is_deleted = true`)
- **THEN** C1 has `is_deleted = true`, `needsSync = true`
- **AND** C2 remains `is_deleted = true` with `needsSync = true` and updated `updated_at`

### Requirement: Cascading restore for checklist items
When a task is restored, the system SHALL restore ALL checklist_items belonging to that task, regardless of whether they were manually deleted before the task was deleted.

#### Scenario: Restore task restores all checklist items
- **WHEN** user restores task T1 which has checklist items C1 and C2 (both `is_deleted = true`)
- **THEN** T1 has `is_deleted = false`, `needsSync = true`
- **AND** C1 has `is_deleted = false`, `needsSync = true`
- **AND** C2 has `is_deleted = false`, `needsSync = true`

#### Scenario: Restore task with no checklist items
- **WHEN** user restores task T1 which has no checklist items
- **THEN** only T1 has `is_deleted = false`
- **AND** no error occurs

#### Scenario: Restore task restores previously manually deleted checklist items
- **WHEN** user had manually deleted C1 before deleting task T1
- **AND** user restores task T1
- **THEN** C1 has `is_deleted = false` (restored along with all other checklist items)

### Requirement: Self-healing removes orphaned checklist items before push
Before sending push data to the server, the system SHALL detect checklist_items whose `task_id` references a task that does not physically exist in IndexedDB. Such orphaned checklist_items SHALL be hard-deleted from IndexedDB and excluded from push data.

#### Scenario: Orphaned checklist item is removed before push
- **WHEN** push collects checklist item C1 with `task_id = T99`
- **AND** task T99 does not exist in IndexedDB
- **THEN** C1 is hard-deleted from IndexedDB
- **AND** C1 is NOT included in push data
- **AND** a warning is logged: `"Orphaned checklist item C1 references missing task T99"`

#### Scenario: Checklist item with existing task is not affected
- **WHEN** push collects checklist item C1 with `task_id = T1`
- **AND** task T1 exists in IndexedDB (regardless of `is_deleted` flag)
- **THEN** C1 is included in push data normally

#### Scenario: Self-healing with incremental push
- **WHEN** incremental push (`force = false`) collects checklist item C1 with `task_id = T1`
- **AND** T1 is NOT in push data (not dirty) but EXISTS in IndexedDB
- **THEN** C1 is included in push data normally (T1 already on server or will be)

#### Scenario: Self-healing with no orphans
- **WHEN** push collects checklist items and all have valid task_id references
- **THEN** no items are removed and no warnings are logged

### Requirement: ChecklistRepository provides getAllByTaskId and getActiveByTaskId methods
The ChecklistRepository SHALL provide two methods for retrieving checklist_items by task:
- `getAllByTaskId(taskId: string)` — returns all checklist_items (including soft-deleted) for the given task. Used by cascade operations (FR1, FR2).
- `getActiveByTaskId(taskId: string)` — returns only non-deleted checklist_items for the given task. Used by UI and copy operations.

The existing `getByTaskId` method SHALL be renamed to `getActiveByTaskId` (preserving its current filtering behavior), and the new `getAllByTaskId` method SHALL be added without the `is_deleted` filter.

#### Scenario: getAllByTaskId returns all items including soft-deleted
- **WHEN** `getAllByTaskId("T1")` is called
- **AND** T1 has checklist items C1 (`is_deleted = false`) and C2 (`is_deleted = true`)
- **THEN** result contains both C1 and C2

#### Scenario: getAllByTaskId returns empty array for task with no items
- **WHEN** `getAllByTaskId("T1")` is called
- **AND** T1 has no checklist items
- **THEN** result is an empty array

#### Scenario: getActiveByTaskId returns only non-deleted items
- **WHEN** `getActiveByTaskId("T1")` is called
- **AND** T1 has checklist items C1 (`is_deleted = false`) and C2 (`is_deleted = true`)
- **THEN** result contains only C1

### Requirement: Unsynced indicator uses needsSync flag
The UI unsynced indicator (amber bar/border) SHALL use `entity.needsSync` to determine visibility. The indicator SHALL NOT use timestamp comparison (`updated_at > lastSyncedAt`).

#### Scenario: Item created during sync cycle retains indicator
- **WHEN** push() collects items A and B with `needsSync = true`
- **AND** item C is created during the sync cycle with `needsSync = true`
- **AND** sync cycle completes, setting `lastSyncedAt` to current time
- **THEN** item C SHALL show the unsynced indicator because `needsSync = true`

#### Scenario: Successfully pushed item loses indicator
- **WHEN** item A is pushed and server returns `created` or `accepted`
- **AND** `needsSync` is set to `false` by push result application
- **THEN** item A SHALL NOT show the unsynced indicator

#### Scenario: Item with needsSync false shows no indicator
- **WHEN** entity has `needsSync = false`
- **THEN** unsynced indicator is not visible regardless of `updated_at` or `lastSyncedAt` values

### Requirement: Checklist unsynced aggregation uses needsSync flag
The `hasUnsyncedItems` computation in the checklist hook SHALL use `item.needsSync` to determine if any checklist items need sync. It SHALL NOT use timestamp comparison.

#### Scenario: One unsynced checklist item flags the task
- **WHEN** a task has 3 checklist items, 1 with `needsSync = true`
- **THEN** `hasUnsyncedItems` is `true`

#### Scenario: All synced checklist items clear the flag
- **WHEN** all checklist items have `needsSync = false`
- **THEN** `hasUnsyncedItems` is `false`
