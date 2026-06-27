## ADDED Requirements

### Requirement: Ping returns adapter status  # implements FR1 of adapter-inmemory-spec

The adapter SHALL return `{ ok: true, app: "inmemory", version: "0.1.0", initialized: false }` from `ping()` before `init()` is called, and `initialized: true` after `init()` has been called.

#### Scenario: Ping before init returns uninitialized  # implements FR1 of adapter-inmemory-spec
- **WHEN** `ping()` is called on a fresh adapter instance
- **THEN** the response has `ok: true`, `app: "inmemory"`, `version: "0.1.0"`, and `initialized: false`

#### Scenario: Ping after init returns initialized  # implements FR1 of adapter-inmemory-spec
- **WHEN** `init()` is called and then `ping()` is called
- **THEN** the response has `initialized: true`

### Requirement: Init sets initialized flag and is idempotent  # implements FR1 of adapter-inmemory-spec

The adapter SHALL return `{ ok: true }` from `init()`. Calling `init()` multiple times SHALL be idempotent.

#### Scenario: Init returns ok  # implements FR1 of adapter-inmemory-spec
- **WHEN** `init()` is called
- **THEN** the response has `ok: true`

#### Scenario: Init is idempotent  # implements FR1 of adapter-inmemory-spec
- **WHEN** `init()` is called twice
- **THEN** both calls return `{ ok: true }`

### Requirement: Push creates new entity with revision  # implements FR2 of adapter-inmemory-spec

The adapter SHALL assign the current revision number to a newly pushed entity and return `status: "created"`. The revision SHALL increment after each push batch.

#### Scenario: New entity gets created status  # implements FR2 of adapter-inmemory-spec
- **WHEN** a task with a valid UUID is pushed for the first time
- **THEN** the result has `status: "created"` and the push response has a `revision` greater than 0

#### Scenario: Revision increments per push batch  # implements FR2 of adapter-inmemory-spec
- **WHEN** two separate push calls are made
- **THEN** the second push has a higher revision than the first

### Requirement: Push accepts update with newer timestamp  # implements FR2 of adapter-inmemory-spec

The adapter SHALL accept an update to an existing entity when the incoming `updated_at` is newer than or equal to the server record's `updated_at`, returning `status: "accepted"`.

#### Scenario: Update with newer timestamp is accepted  # implements FR2 of adapter-inmemory-spec
- **WHEN** an entity is pushed with `updated_at: "2026-01-01T10:00:00.000Z"` and then updated with `updated_at: "2026-01-01T12:00:00.000Z"`
- **THEN** the update result has `status: "accepted"`

#### Scenario: Update with equal timestamp is accepted  # implements FR2 of adapter-inmemory-spec
- **WHEN** an entity is pushed and then updated with the same `updated_at` timestamp
- **THEN** the update result has `status: "accepted"`

### Requirement: Push validates entity UUID format  # implements FR4 of adapter-inmemory-spec

The adapter SHALL reject entities with invalid UUID format, returning `status: "rejected"` with reason `"Invalid UUID format"`.

#### Scenario: Invalid UUID is rejected  # implements FR4 of adapter-inmemory-spec
- **WHEN** a task with `id: "not-a-uuid"` is pushed
- **THEN** the result has `status: "rejected"` and `reason: "Invalid UUID format"`

### Requirement: Push validates entity name is not blank  # implements FR4 of adapter-inmemory-spec

The adapter SHALL reject entities with a blank (empty or whitespace-only) `name` field, returning `status: "rejected"` with reason `"Name must not be blank"`.

#### Scenario: Blank name is rejected  # implements FR4 of adapter-inmemory-spec
- **WHEN** a task with `name: ""` is pushed
- **THEN** the result has `status: "rejected"` and `reason: "Name must not be blank"`

### Requirement: Push validates task box value  # implements FR4 of adapter-inmemory-spec

The adapter SHALL reject tasks with a `box` value not in `["inbox", "today", "week", "later"]`, returning `status: "rejected"` with an appropriate reason.

#### Scenario: Invalid box is rejected  # implements FR4 of adapter-inmemory-spec
- **WHEN** a task with `box: "invalid"` is pushed
- **THEN** the result has `status: "rejected"` and a reason containing the invalid box value

### Requirement: Push detects conflict for stale updates  # implements FR5 of adapter-inmemory-spec

The adapter SHALL return `status: "conflict"` with the `server_record` when the incoming `updated_at` is older than the server record's `updated_at`.

#### Scenario: Stale update returns conflict with server record  # implements FR5 of adapter-inmemory-spec
- **WHEN** a task is pushed with `updated_at: "2026-01-02T00:00:00.000Z"` and then a stale update arrives with `updated_at: "2026-01-01T12:00:00.000Z"`
- **THEN** the result has `status: "conflict"` and `server_record` contains the current server version

### Requirement: Pull returns entities after since_revision  # implements FR3 of adapter-inmemory-spec

The adapter SHALL return only entities with `revision > since_revision` in the pull response.

#### Scenario: Pull filters by since_revision  # implements FR3 of adapter-inmemory-spec
- **WHEN** two tasks are pushed in separate batches and `pull` is called with `since_revision` equal to the first batch's revision
- **THEN** only the task from the second batch is returned

#### Scenario: Pull returns empty arrays for fresh state  # implements FR3 of adapter-inmemory-spec
- **WHEN** `pull` is called with `since_revision: 0` on an empty adapter
- **THEN** all entity arrays are empty, `current_revision` is 0, and `purge_revision` is 0

### Requirement: Pull returns current_revision  # implements FR3 of adapter-inmemory-spec

The adapter SHALL include `current_revision` in the pull response, reflecting the revision of the most recent push.

#### Scenario: current_revision reflects latest push  # implements FR3 of adapter-inmemory-spec
- **WHEN** entities are pushed and then `pull` is called
- **THEN** `current_revision` equals the revision from the last push

### Requirement: In-memory adapter supports composite cursor pull pagination
The in-memory adapter SHALL support a configurable `maxRowsPerTable` parameter. When the number of matching records in any table exceeds `maxRowsPerTable`, the adapter SHALL return only `maxRowsPerTable` records (ordered by revision ASC, id ASC), set `has_more = true`, compute `current_revision` as `MIN(max_revision)` across tables with data, and return `cursors` with `{ revision, last_id }` for each truncated table. When a pull request includes `cursors`, the adapter SHALL use composite cursor logic to resume from the cursor position.

#### Scenario: No pagination when records fit within limit
- **WHEN** `maxRowsPerTable` is 100 and table has 50 matching records
- **THEN** all 50 records are returned
- **AND** `has_more` is `false`
- **AND** no `cursors` in response

#### Scenario: Pagination triggered when records exceed limit
- **WHEN** `maxRowsPerTable` is 10 and table has 25 matching records
- **THEN** first pull returns 10 records with `has_more = true`
- **AND** `cursors` contains entry for the truncated table with revision and last_id

#### Scenario: Composite cursor resumes correctly with same-revision records
- **WHEN** `maxRowsPerTable` is 10 and table has 15 records all with revision=5
- **THEN** first pull returns 10 records ordered by (revision, id) with cursor
- **AND** second pull with cursor returns remaining 5 records
- **AND** no records are lost or duplicated within the truncated table

#### Scenario: Multiple pagination rounds return all records
- **WHEN** `maxRowsPerTable` is 10 and table has 25 matching records
- **THEN** 3 pull requests return all 25 records (10 + 10 + 5)
- **AND** last response has `has_more = false` and no `cursors`

### Requirement: Push and pull settings by key  # implements FR6 of adapter-inmemory-spec

The adapter SHALL store settings keyed by `setting.key`. New settings SHALL get `status: "created"`. Updated settings with a newer `updated_at` SHALL get `status: "accepted"`.

#### Scenario: New setting is created  # implements FR6 of adapter-inmemory-spec
- **WHEN** a setting with `key: "accent_color"` is pushed for the first time
- **THEN** the result has `status: "created"` and the setting is returned in pull

#### Scenario: Setting conflict when server is newer  # implements FR6 of adapter-inmemory-spec
- **WHEN** a setting exists with `updated_at: "2026-01-02T00:00:00.000Z"` and a stale update arrives with `updated_at: "2026-01-01T00:00:00.000Z"`
- **THEN** the result has `status: "conflict"` with `server_record`

### Requirement: Pull filters settings by settings_updated_at  # implements FR6 of adapter-inmemory-spec

The adapter SHALL filter settings by `settings_updated_at` parameter in pull requests, returning only settings with `updated_at` greater than the specified timestamp.

#### Scenario: Settings filtered by updated_at  # implements FR6 of adapter-inmemory-spec
- **WHEN** two settings exist with different `updated_at` and pull is called with `settings_updated_at` between the two timestamps
- **THEN** only the setting with the newer `updated_at` is returned

### Requirement: Upload single cover with deduplication  # implements FR7 of adapter-inmemory-spec

The adapter SHALL store cover data keyed by `data_hash`. A new upload returns `reused: false`. Uploading the same `data_hash` again SHALL increment `ref_count` and return `reused: true`.

#### Scenario: New cover upload  # implements FR7 of adapter-inmemory-spec
- **WHEN** a cover is uploaded with a new `data_hash`
- **THEN** the response has `ok: true`, the correct `data_hash`, and `reused: false`

#### Scenario: Duplicate cover is reused  # implements FR7 of adapter-inmemory-spec
- **WHEN** a cover is uploaded with the same `data_hash` as an existing cover
- **THEN** the response has `reused: true` and `ref_count` is incremented

### Requirement: Batch cover upload with size limit  # implements FR8 of adapter-inmemory-spec

The adapter SHALL process batch uploads of up to 10 covers. Batches exceeding 10 SHALL be rejected with `ok: false`. Individual covers with non-image mime types SHALL return an error per item.

#### Scenario: Batch within limit succeeds  # implements FR8 of adapter-inmemory-spec
- **WHEN** a batch of 2 covers with valid mime types is uploaded
- **THEN** the response has `ok: true` and 2 results

#### Scenario: Batch exceeding limit is rejected  # implements FR8 of adapter-inmemory-spec
- **WHEN** a batch of 11 covers is uploaded
- **THEN** the response has `ok: false`

#### Scenario: Invalid mime type returns per-item error  # implements FR8 of adapter-inmemory-spec
- **WHEN** a batch contains a cover with `mime_type: "text/plain"`
- **THEN** that item's result has an `error` field

### Requirement: Get cover by hash  # implements FR9 of adapter-inmemory-spec

The adapter SHALL return cover data for known hashes and an error for unknown hashes.

#### Scenario: Get existing cover  # implements FR9 of adapter-inmemory-spec
- **WHEN** `getCover` is called with a hash of an uploaded cover
- **THEN** the response contains the cover's `mime_type` and `data`

#### Scenario: Get missing cover returns error  # implements FR9 of adapter-inmemory-spec
- **WHEN** `getCover` is called with a non-existent hash
- **THEN** the result for that hash has an `error` field

### Requirement: Delete cover with reference counting  # implements FR10 of adapter-inmemory-spec

The adapter SHALL decrement `ref_count` on delete. When `ref_count` reaches 0, the cover SHALL be physically removed. Deleting a non-existent cover SHALL return `{ ok: true, deleted: true, ref_count: 0 }`.

#### Scenario: Delete shared cover decrements ref_count  # implements FR10 of adapter-inmemory-spec
- **WHEN** a cover with `ref_count: 2` is deleted once
- **THEN** the response has `deleted: false` and `ref_count: 1`

#### Scenario: Delete last reference removes cover  # implements FR10 of adapter-inmemory-spec
- **WHEN** a cover with `ref_count: 1` is deleted
- **THEN** the response has `deleted: true` and `ref_count: 0`, and the cover is no longer retrievable

#### Scenario: Delete non-existent cover  # implements FR10 of adapter-inmemory-spec
- **WHEN** `deleteCover` is called with a non-existent hash
- **THEN** the response has `ok: true`, `deleted: true`, and `ref_count: 0`

### Requirement: Purge removes soft-deleted entities  # implements FR11 of adapter-inmemory-spec

The adapter SHALL remove all entities with `is_deleted: true` across all 6 entity types (tasks, goals, contexts, categories, ideas, checklist_items). Non-deleted entities SHALL be preserved. The `purge_revision` SHALL increment on each purge call.

#### Scenario: Soft-deleted entities are removed  # implements FR11 of adapter-inmemory-spec
- **WHEN** a deleted task and a non-deleted task exist and `purge()` is called
- **THEN** the purge response reports 1 task purged, and only the non-deleted task remains in pull

#### Scenario: Purge increments purge_revision  # implements FR11 of adapter-inmemory-spec
- **WHEN** `purge()` is called twice
- **THEN** `purge_revision` increments from 1 to 2

#### Scenario: Purge across all entity types  # implements FR11 of adapter-inmemory-spec
- **WHEN** one soft-deleted entity of each type is pushed and `purge()` is called
- **THEN** each entity type reports 1 purged item
