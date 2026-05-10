# Data Model & Sync Protocol

## Entities

**Tasks** — core entity
Fields: `id` (UUID v4), `name`, `description`, `box` (inbox | today | week | later), `goal_id`, `context_id`, `category_id`, `is_completed`, `completed_at`, `repeat_rule`, `is_hidden`, `next_date`, `appear_date`, `original_task_id`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`, `revision`

**Goals** — objectives
Fields: `id`, `name`, `description?`, `cover_file_id?` (Google Drive), `status` (planning | in_progress | paused | completed | cancelled), `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`, `revision`

**Ideas** — user ideas
Fields: `id`, `name`, `description`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`, `revision`

**Contexts** — contexts (@Home, @Office...)
Fields: `id`, `name`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`, `revision`

**Categories** — life areas (Work, Family...)
Same structure as Contexts.

**Checklist_Items** — subtasks
Fields: `id`, `task_id`, `name`, `is_completed`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`, `revision`

**Settings** — key-value
Fields: `key`, `value`, `updated_at`
Implemented keys: `default_box`, `accent_color`, `custom_accent_light`, `custom_accent_dark`

**Meta** — sync revision counters (server-side Google Sheet, not a regular entity)
Fields: `key`, `value`
Keys: `next_revision` (starts at 1, incremented after each successful push), `purge_revision` (starts at 0, incremented after each purge)

> **Client-only field:** All entities (including Settings) have `needsSync: boolean` in IndexedDB. This field is never sent to the server — it is stripped before push. See "Dirty Flag" section below.

## Relationships

- `Tasks.goal_id` -> `Goals.id` (0..1 : N)
- `Tasks.context_id` -> `Contexts.id` (0..1 : N)
- `Tasks.category_id` -> `Categories.id` (0..1 : N)
- `Checklist_Items.task_id` -> `Tasks.id` (1 : N)

## Backend API

Single endpoint: `https://script.google.com/macros/s/{DEPLOY_ID}/exec`
Routing via `action` field in request body. Format: JSON.

### Actions

| Action          | Method | Purpose                                                     |
|-----------------|--------|-------------------------------------------------------------|
| `ping`          | GET    | Health check; returns `{ ok: true, initialized: bool }`     |
| `init`          | POST   | Create Drive folder + Sheets + sheet structure (idempotent) |
| `pull`          | POST   | Get changes since client's known revision                   |
| `push`          | POST   | Send local changes to server                                |
| `upload_cover`  | POST   | Upload goal cover image (base64, <=2MB, SHA-256 dedup)      |
| `upload_covers` | POST   | Batch upload covers (up to 10)                              |
| `get_cover`     | POST   | Download cover images by file_id                            |
| `delete_cover`  | POST   | Delete cover (checks ref_count before actual delete)        |
| `purge`         | POST   | Hard-delete soft-deleted records                            |

## Pull/Push Protocol

**Pull**: client sends `since_revision` (single number) + optional `settings_updated_at`. Server returns all records with `revision > since_revision`. Response includes `current_revision` (`next_revision - 1` from Meta sheet), `purge_revision`, `server_time`. Settings filtered by `updated_at` when `settings_updated_at` provided. Client compares server's `purge_revision` with its local `last_known_purge_revision` — if server's is higher, client hard-deletes local soft-deleted records.

**Push**: client sends only records with `needsSync = true` (arrays per entity type). Server reads `next_revision` from Meta sheet, assigns it to all accepted records, then increments it. Response statuses: `created`, `accepted`, `conflict` (includes `server_record`), `rejected`. Response includes `revision`, `server_time`. **Conflict resolution: last-write-wins by `updated_at`.**

## Sync Engine

### Flow

1. **App open**: `push` queued changes -> `pull` -> cover sync
2. **User makes changes**: write to IndexedDB immediately (optimistic UI)
3. **After changes settle**: `push` with debounce (15 seconds)
4. **Periodic**: `pull` every 5 minutes while app is active
5. **Reconnect after offline**: `push` queued changes -> `pull` to catch up

### Dirty Flag (`needsSync`)

Client-side boolean flag on every entity in IndexedDB. Tracks which records have local changes not yet confirmed by the server.

**Lifecycle:**
1. **Set `true`** — on create, update, delete (soft), complete/uncomplete. Only if data actually changed (`hasEntityChanged()` from `utils/deepEqual.ts` compares fields, ignoring `id`, `version`, `updated_at`, `created_at`, `needsSync`, `revision`).
2. **Push** — `getNeedingSync()` in each repository collects records with `needsSync = true`. Field is stripped before sending to API.
3. **Set `false`** — after server confirms (`created`/`accepted`). On `conflict` — server record overwrites local, `needsSync = false`.
4. **Pull protection** — server records overwrite local only if local `needsSync = false`. If `needsSync = true`, the local version is preserved (it will be pushed later).
5. **Full reset** (`resetAndPull`) — all records set to `needsSync = false` before pulling full state.

Details: `docs/SYNC_OPTIMIZATION.md`, `docs/sync-redesign.md`.

### Revision Tracking

Client stores sync state in IndexedDB table `sync_meta` (via `SyncMetaRepository`):
- `last_known_revision` — highest revision received from server (default 0); sent as `since_revision` in pull requests
- `last_known_purge_revision` — highest purge_revision received from server (default 0); used to detect when server has purged records

Both values are updated after each successful pull. `last_known_revision` is also updated after a successful push.

### Sync Rules

- Never lose local data — offline changes always get pushed eventually
- On conflict: accept server record (last-write-wins), but log conflict for debugging
- Sync should be invisible to user; show subtle indicator only on error
- All sync operations are non-blocking; UI never freezes waiting for sync
