# Data Model & Sync Protocol

## Entities

**Tasks** — core entity
Fields: `id` (UUID v4), `name`, `description`, `box` (inbox | today | week | later), `goal_id`, `context_id`, `category_id`, `is_completed`, `completed_at`, `repeat_rule`, `is_hidden`, `next_date`, `appear_date`, `original_task_id`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `revision`

**Goals** — objectives
Fields: `id`, `name`, `description`, `cover_hash` (SHA-256 hex string, content-addressable), `status` (planning | in_progress | paused | completed | cancelled), `sort_order`, `is_deleted`, `created_at`, `updated_at`, `revision`

**Ideas** — user ideas
Fields: `id`, `name`, `description`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `revision`

**Contexts** — contexts (@Home, @Office...)
Fields: `id`, `name`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `revision`

**Categories** — life areas (Work, Family...)
Same structure as Contexts.

**Checklist_Items** — subtasks
Fields: `id`, `task_id`, `name`, `is_completed`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `revision`

**Attachments** — file attachments for tasks, goals, ideas
Fields: `id` (UUID v4), `entity_type` (task | goal | idea), `entity_id` (UUID), `data_hash` (SHA-256), `filename`, `mime_type`, `file_size` (bytes), `sort_order`, `is_deleted`, `created_at`, `updated_at`, `revision`

**Settings** — key-value
Fields: `key`, `value`, `updated_at`
Implemented keys: `default_box`, `accent_color`, `custom_accent_light`, `custom_accent_dark`, `day_boundary`

**Meta** — sync revision counters (server-side, not a regular entity)
Fields: `key`, `value`
Keys: `next_revision` (starts at 1, incremented after each successful push), `purge_revision` (starts at 0, incremented after each purge)

> **Client-only field:** All entities (including Settings) have `syncStatus: "synced" | "pending" | "rejected"` in IndexedDB. This field is never sent to the server — it is stripped before push. See "Sync Status" section below.

## Field types

| Field                                      | Type                 | Notes                                           |
|--------------------------------------------|----------------------|-------------------------------------------------|
| `id`                                       | UUID v4 string       | Generated client-side via `crypto.randomUUID()` |
| `sort_order`                               | string               | Lexicographic ordering for manual sort          |
| `revision`                                 | non-negative integer | Assigned by server, never by client             |
| `created_at`, `updated_at`, `completed_at` | ISO 8601 timestamp   | `"2025-01-15T10:30:00.000Z"`                    |
| `next_date`, `appear_date`                 | ISO 8601 date        | `"2025-01-15"`                                  |
| Empty optional fields                      | `""` (empty string)  | Never `null` or `undefined`                     |

## Relationships

- `Tasks.goal_id` -> `Goals.id` (0..1 : N)
- `Tasks.context_id` -> `Contexts.id` (0..1 : N)
- `Tasks.category_id` -> `Categories.id` (0..1 : N)
- `Checklist_Items.task_id` -> `Tasks.id` (1 : N)
- `Attachments.entity_id` -> `Tasks.id` / `Goals.id` / `Ideas.id` (polymorphic via `entity_type`, 1 : N)

## Backend API

Single endpoint: `https://script.google.com/macros/s/{DEPLOY_ID}/exec` (GAS) or Supabase Edge Functions.
Routing via `action` field in request body. Format: JSON.

### Actions

| Action         | Method | Purpose                                                               |
|----------------|--------|-----------------------------------------------------------------------|
| `ping`         | GET    | Health check; returns `{ ok, app, version, initialized }`             |
| `init`         | POST   | Create backend data structure (idempotent)                            |
| `pull`         | POST   | Get changes since client's known revision (supports pagination)       |
| `push`         | POST   | Send local changes to server (supports chunking)                      |
| `upload_file`  | POST   | Upload file (base64, <=5MB attachments / <=2MB covers, SHA-256 dedup) |
| `upload_files` | POST   | Batch upload files (up to 10)                                         |
| `get_file`     | POST   | Download files by data_hash                                           |
| `delete_file`  | POST   | Delete file (checks ref_count before actual delete)                   |
| `purge`        | POST   | Hard-delete soft-deleted records                                      |

## Pull/Push Protocol

### Pull

Client sends `since_revision` (single number) + optional `settings_updated_at` + optional `cursors` (for pagination). Server returns all records with `revision > since_revision` for each entity type (tasks, goals, contexts, categories, ideas, checklist_items, attachments). Settings filtered by `updated_at` when `settings_updated_at` provided.

**Response fields:** `ok`, `tasks`, `goals`, `contexts`, `categories`, `ideas`, `checklist_items`, `attachments`, `settings`, `current_revision`, `purge_revision`, `server_time`, `has_more`, optional `cursors`.

Client compares server's `purge_revision` with its local `last_known_purge_revision` — if server's is higher, client hard-deletes local soft-deleted records.

### Pull Pagination (composite cursors)

When PostgREST `PGRST_DB_MAX_ROWS` truncates a table, server returns `has_more: true` with per-table `cursors: { [table]: { revision, last_id } }`. Client loops `pull()` passing cursors from previous response until `has_more === false`. Client saves `last_known_revision` ONLY after final page.

Cursor filter per table: `revision > R OR (revision = R AND id > ID)`. Tables without cursor use standard `gt("revision", since_revision)`. Settings are excluded from pagination (fixed small set of keys).

### Push

Client sends only records with `syncStatus = "pending"` (arrays per entity type, including attachments). Server reads `next_revision` from Meta, assigns it to all accepted records, then increments it.

**Response statuses:** `created`, `accepted`, `conflict` (includes `server_record`), `rejected` (includes `reason`).

**Rejection reasons** (structured format): `fk_violation:goal_id`, `check_violation:box`, `unique_violation`, etc.

**Conflict resolution: last-write-wins by `updated_at`** (>= means client wins).

### Chunked Push

When dirty records exceed `PUSH_CHUNK_SIZE` (200), push is split into sequential chunks. Fill order: `contexts -> categories -> goals -> ideas -> tasks -> checklist_items -> attachments -> settings`. This ensures parent entities land in the same or earlier chunk than their children. If a chunk fails, remaining chunks are skipped.

## Sync Engine

### Flow

1. **App open**: `push` queued changes -> `pull` -> file sync
2. **User makes changes**: write to IndexedDB immediately (optimistic UI)
3. **After changes settle**: `push` with debounce (15 seconds)
4. **Periodic**: `pull` every 5 minutes while app is active
5. **Reconnect after offline**: `push` queued changes -> `pull` to catch up

### Sync Status (`syncStatus`)

Client-side enum field on every entity in IndexedDB: `"synced"`, `"pending"`, `"rejected"`. Tracks sync state of each record.

**Lifecycle:**
1. **Set `"pending"`** — on create, update, delete (soft), complete/uncompleted. Only if data actually changed (`hasEntityChanged()` compares fields, ignoring `id`, `updated_at`, `created_at`, `syncStatus`, `revision`).
2. **Push** — `getNeedingSync()` in each repository collects records with `syncStatus = "pending"`. Field is stripped before sending to API.
3. **Set `"synced"`** — after server confirms (`created`/`accepted`), only if local record's `updated_at` hasn't changed since push was sent (no concurrent edit). On `conflict` — server record overwrites local, `syncStatus = "synced"`.
4. **Set `"rejected"`** — for unhealable rejections (e.g. `check_violation:status`). Record stays in IndexedDB.
5. **Self-healing** — for healable rejections (e.g. `fk_violation:goal_id`), client fixes the field (e.g. clears `goal_id`), sets `syncStatus = "pending"`, and retries (max 2 times within same sync cycle).
6. **Pull protection** — server records overwrite local only if local `syncStatus = "synced"`. If `"pending"`, the local version is preserved.
7. **Full reset** (`resetAndPull`) — all records set to `syncStatus = "synced"` before pulling full state.

### Revision Tracking

Client stores sync state in IndexedDB table `sync_meta` (via `SyncMetaRepository`):
- `last_known_revision` — highest revision received from server (default 0); sent as `since_revision` in pull requests
- `last_known_purge_revision` — highest purge_revision received from server (default 0); used to detect when server has purged records

Both values are updated after each successful pull (only after final page if paginated). `last_known_revision` is also updated after a successful push.

### Cascading Soft-Delete

When a task is soft-deleted, all its **checklist_items** and **attachments** are also soft-deleted (`is_deleted = true`, `syncStatus = "pending"`, `updated_at` refreshed). Same for goals and ideas — their attachments are cascaded.

On restore, ALL child records are restored regardless of whether they were manually deleted before the parent was deleted.

### Self-Healing Before Push

Before push, client detects orphaned checklist_items whose `task_id` references a task that doesn't exist in IndexedDB. Such items are hard-deleted locally and excluded from push data.

### Sync Rules

- Never lose local data — offline changes always get pushed eventually
- On conflict: accept server record (last-write-wins), but log conflict for debugging
- Sync should be invisible to user; show subtle indicator only on error
- All sync operations are non-blocking; UI never freezes waiting for sync
- Unsynced indicator uses `syncStatus` field (amber for `"pending"`, red for `"rejected"`)
