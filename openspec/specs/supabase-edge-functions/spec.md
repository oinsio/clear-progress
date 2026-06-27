## Requirements

### Requirement: Ping Edge Function
The `/ping` Edge Function SHALL accept GET requests without authentication. It SHALL return `{ ok: true, app: "supabase", version: "<version>", initialized: false }` when no auth token is provided. When a valid Bearer token is provided, it SHALL check whether the authenticated user has rows in `sync_meta` and return the actual `initialized` status.

#### Scenario: Ping without auth
- **WHEN** GET request is sent to `/ping` without Authorization header
- **THEN** response is `{ ok: true, app: "supabase", version: "0.1.0", initialized: false }`

#### Scenario: Ping with auth for initialized user
- **WHEN** GET request is sent with valid Bearer token
- **AND** user has rows in `sync_meta`
- **THEN** response includes `initialized: true`

#### Scenario: Ping with auth for uninitialized user
- **WHEN** GET request is sent with valid Bearer token
- **AND** user has no rows in `sync_meta`
- **THEN** response includes `initialized: false`

### Requirement: Init Edge Function
The `/init` Edge Function SHALL accept POST requests with valid Bearer token. It SHALL create per-user rows in `sync_meta` (`next_revision=1`, `purge_revision=0`) if they do not exist. The operation SHALL be idempotent.

#### Scenario: First init for new user
- **WHEN** authenticated user calls `/init` for the first time
- **THEN** `sync_meta` rows are created: `(user_id, 'next_revision', 1)` and `(user_id, 'purge_revision', 0)`
- **AND** response is `{ ok: true }`

#### Scenario: Repeated init is idempotent
- **WHEN** authenticated user calls `/init` after already being initialized
- **THEN** existing `sync_meta` rows are unchanged
- **AND** response is `{ ok: true }`

### Requirement: Pull Edge Function
The `/pull` Edge Function SHALL accept POST requests with `{ since_revision, settings_updated_at? }`. It SHALL return all records belonging to the authenticated user with `revision > since_revision`. Settings SHALL be filtered by `updated_at > settings_updated_at` when provided. The function SHALL use `select("*", { count: "exact" })` for all entity table queries, apply `.order("revision", { ascending: true }).order("id", { ascending: true })`, and support composite cursor pagination for truncated tables.

#### Scenario: Incremental pull
- **WHEN** user sends `{ since_revision: 5 }`
- **THEN** response contains only records with `revision > 5` for this user
- **AND** response includes `current_revision`, `purge_revision`, `server_time`

#### Scenario: Full pull
- **WHEN** user sends `{ since_revision: 0 }`
- **THEN** response contains all records for this user

#### Scenario: Settings filtered by timestamp
- **WHEN** user sends `{ since_revision: 0, settings_updated_at: "2025-06-01T10:00:00.000Z" }`
- **THEN** only settings with `updated_at > "2025-06-01T10:00:00.000Z"` are returned

#### Scenario: Datetime serialization in pull response
- **WHEN** pull returns records
- **THEN** TIMESTAMPTZ fields are serialized as ISO 8601 with Z suffix (`2025-01-15T10:30:00.000Z`)
- **AND** DATE fields are serialized as `YYYY-MM-DD` (`2025-01-15`)

#### Scenario: Query includes count exact
- **WHEN** pull Edge Function queries the tasks table
- **THEN** the Supabase query uses `select("*", { count: "exact" })`
- **AND** response includes both `data` and `count`

#### Scenario: Query orders by revision then id ascending
- **WHEN** pull Edge Function queries the tasks table
- **THEN** the query includes `.order("revision", { ascending: true }).order("id", { ascending: true })`

#### Scenario: Composite cursor filter used when cursor present in request
- **WHEN** request includes `cursors: { tasks: { revision: 5, last_id: "abc" } }`
- **THEN** tasks query uses `.or('revision.gt.5,and(revision.eq.5,id.gt.abc)')`
- **AND** other tables without cursor use `.gt("revision", since_revision)`

#### Scenario: has_more computed from any truncated table
- **WHEN** tasks count is 1500 but data length is 1000
- **AND** all other tables have count equal to data length
- **THEN** `has_more` is `true`

#### Scenario: Cursors returned for truncated tables only
- **WHEN** tasks is truncated (count > data.length) with last row revision=5, id="xyz"
- **AND** goals is not truncated
- **THEN** response `cursors` contains `{ tasks: { revision: 5, last_id: "xyz" } }`
- **AND** `cursors` does not contain `goals`

#### Scenario: current_revision uses MIN of max revisions when truncated
- **WHEN** tasks max revision in batch is 800, goals max revision is 600
- **AND** `has_more` is `true`
- **THEN** `current_revision` is 600

### Requirement: Push Edge Function
The `/push` Edge Function SHALL accept POST requests with entity arrays (tasks, goals, contexts, categories, ideas, checklist_items, settings). It SHALL validate the payload and delegate transactional logic to the PostgreSQL RPC function `push_records` via `supabase.rpc(...)`. The RPC function acquires a `FOR UPDATE` lock on the user's `next_revision` row in `sync_meta`, assigns the current revision to all accepted records, increments `next_revision`, and returns per-record results. The Edge Function formats the RPC response for the client.

#### Scenario: Push assigns revision atomically
- **WHEN** user pushes 3 tasks
- **THEN** function reads `next_revision` with `FOR UPDATE` lock
- **AND** all 3 tasks receive the same revision number
- **AND** `next_revision` is incremented by 1

#### Scenario: Push sets user_id from JWT
- **WHEN** user pushes records
- **THEN** `user_id` is set to `auth.uid()` from JWT, not from request payload

#### Scenario: Conflict resolution — last-write-wins
- **WHEN** client record has `updated_at < server record.updated_at`
- **THEN** result status is `conflict` with `server_record`

#### Scenario: Validation rejects invalid records
- **WHEN** record has invalid UUID, blank name, or invalid box value
- **THEN** result status is `rejected` with `reason`

#### Scenario: Lock timeout
- **WHEN** `FOR UPDATE` lock cannot be acquired within 10 seconds
- **THEN** response is `{ ok: false, error: "SYNC_LOCK_TIMEOUT" }`

### Requirement: Upload Cover Edge Function
The `/upload-cover` Edge Function SHALL accept POST requests with `{ goal_id, filename, mime_type, data, data_hash }`. It SHALL check for hash deduplication, store the file in Supabase Storage at path `{user_id[0:2]}/{user_id}/{data_hash[0:2]}/{file_id}.{ext}`, and create a record in the `covers` table. The response SHALL return `data_hash` instead of `file_id`.

#### Scenario: New cover uploaded
- **WHEN** user uploads a cover with unique `data_hash`
- **THEN** file is stored in Storage
- **AND** `covers` table gets a new row with `ref_count = 1`
- **AND** response is `{ ok: true, data_hash: "<hash>", reused: false }`

#### Scenario: Duplicate hash reuses existing cover
- **WHEN** user uploads a cover with `data_hash` matching an existing cover
- **THEN** `ref_count` is incremented on existing cover
- **AND** response is `{ ok: true, data_hash: "<hash>", reused: true }`

### Requirement: Upload Covers (batch) Edge Function
The `/upload-covers` Edge Function SHALL accept POST requests with `{ covers: [...] }` (up to 10 items). Each item SHALL be processed independently. Results SHALL contain `data_hash` instead of `file_id`. Invalid items SHALL return an error without affecting valid items.

#### Scenario: Batch upload succeeds
- **WHEN** user uploads 3 valid covers
- **THEN** all 3 are stored and results returned per item with `data_hash`

#### Scenario: Batch exceeds limit
- **WHEN** batch contains more than 10 items
- **THEN** response is `{ ok: false, results: [] }`

#### Scenario: Partial failure
- **WHEN** batch contains 1 valid image and 1 invalid mime type
- **THEN** valid image is stored, invalid item returns error

### Requirement: Get Cover Edge Function
The `/get-cover` Edge Function SHALL accept POST requests with `{ hashes: [...] }`. For each hash, it SHALL look up the cover in the `covers` table by `(user_id, data_hash)`, download the file from Storage, and return base64-encoded data. Missing covers SHALL return an error per item.

#### Scenario: Cover found
- **WHEN** user requests existing hash
- **THEN** response includes `{ hash, mime_type, data }` with base64-encoded content

#### Scenario: Cover not found
- **WHEN** user requests non-existent hash
- **THEN** response includes `{ hash, error: "File not found" }`

### Requirement: Delete Cover Edge Function
The `/delete-cover` Edge Function SHALL accept POST requests with `{ hash, goal_id }`. It SHALL look up the cover by `(user_id, data_hash)`, decrement `ref_count`. When `ref_count` reaches 0, it SHALL delete the file from Storage and remove the `covers` table row.

#### Scenario: Shared cover decremented
- **WHEN** cover has `ref_count > 1`
- **THEN** `ref_count` is decremented
- **AND** response is `{ ok: true, deleted: false, ref_count: <new_count> }`

#### Scenario: Last reference deleted
- **WHEN** cover has `ref_count = 1`
- **THEN** file is deleted from Storage
- **AND** `covers` row is deleted
- **AND** response is `{ ok: true, deleted: true, ref_count: 0 }`

### Requirement: Purge Edge Function
The `/purge` Edge Function SHALL hard-delete all records with `is_deleted = true` for the authenticated user across all entity tables, increment `purge_revision` in `sync_meta`, and return counts per entity type.

#### Scenario: Purge removes soft-deleted records
- **WHEN** user has 2 soft-deleted tasks and 1 soft-deleted goal
- **THEN** those records are hard-deleted from the database
- **AND** `purge_revision` is incremented
- **AND** response includes `{ ok: true, purged: { tasks: 2, goals: 1, ... }, purge_revision: <new> }`

### Requirement: Edge Function error format
All Edge Functions SHALL return errors in the format `{ ok: false, error: "<CODE>", message: "<description>" }`. Error codes: `UNAUTHORIZED`, `INVALID_PAYLOAD`, `NOT_INITIALIZED`, `INTERNAL_ERROR`, `SYNC_LOCK_TIMEOUT`, `FILE_TOO_LARGE`, `FILE_NOT_FOUND`.

#### Scenario: Unauthenticated request to protected function
- **WHEN** POST request is sent without valid Bearer token to a protected function
- **THEN** response is `{ ok: false, error: "UNAUTHORIZED", message: "..." }`

#### Scenario: Request to uninitialized user
- **WHEN** authenticated user who has not called `init()` calls `pull` or `push`
- **THEN** response is `{ ok: false, error: "NOT_INITIALIZED", message: "..." }`

### Requirement: Get File Edge Function handles files up to maximum allowed size

The `/get-file` Edge Function SHALL encode downloaded file blobs to base64 using chunked `String.fromCharCode` (chunk size 8192 bytes) to avoid exceeding the JavaScript call stack limit. The function SHALL successfully return base64-encoded data for files up to 5 MB (MAX_ATTACHMENT_SIZE_BYTES). Implements FR1 of fix-get-file-large-payload.

#### Scenario: Small file returned successfully

- **WHEN** user requests a file smaller than 64 KB by hash
- **THEN** response includes `{ hash, mime_type, data }` with correct base64-encoded content

#### Scenario: Large file returned successfully

- **WHEN** user requests a file of 200 KB by hash
- **THEN** response includes `{ hash, mime_type, data }` with correct base64-encoded content
- **AND** the base64 data decodes to the original file bytes

#### Scenario: File at maximum allowed size returned successfully

- **WHEN** user requests a file of 5 MB by hash
- **THEN** response includes `{ hash, mime_type, data }` with correct base64-encoded content
- **AND** no stack overflow or 500 error occurs
