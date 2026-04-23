# Clear Progress

Personal GTD (Getting Things Done) app for task and goal management.
Type: PWA. Architecture: React frontend + Google Apps Script backend + Google Sheets storage.

IMPORTANT: Read existing code, tests, and patterns before generating new code.

## Monorepo Structure

```
frontend/          # React PWA (see frontend/CLAUDE.md)
backend/           # Google Apps Script backend (see backend/CLAUDE.md)
.claude/           # Claude Code rules, docs, skills
```

Each module has its own `CLAUDE.md` with module-specific conventions, tech stack, and commands.

## Code Conventions

- Language: TypeScript strict mode, no `any` unless absolutely necessary
- Formatting: Prettier (defaults) + ESLint
- No default exports except page components and `db.ts`
- Prefer named exports
- No hardcoded values — see `.claude/rules/code-style.md`
- Descriptive naming — see `.claude/rules/naming.md`

### Naming

- Components: `PascalCase.tsx`, one component per file
- Hooks: `useXxx.ts`
- Services/utils: `camelCase.ts`
- Types/interfaces: `PascalCase` (e.g., `Task`, `Goal`, `SyncPayload`)
- Constants: `UPPER_SNAKE_CASE`

## Data Model

### Entities

**Tasks** — core entity
Fields: `id` (UUID v4), `name`, `description`, `box` (inbox | today | week | later), `goal_id`, `context_id`, `category_id`, `is_completed`, `completed_at`, `repeat_rule`, `is_hidden`, `next_date`, `appear_date`, `original_task_id`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`, `revision`

**Goals** — objectives
Fields: `id`, `name`, `description?`, `cover_file_id?` (Google Drive), `status` (planning | in_progress | paused | completed | cancelled), `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`, `revision`

**Ideas** — user ideas
Fields: `id`, `name`, `description`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`, `revision`

**Contexts** — GTD contexts (@Home, @Office...)
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

### Relationships

- `Tasks.goal_id` → `Goals.id` (0..1 : N)
- `Tasks.context_id` → `Contexts.id` (0..1 : N)
- `Tasks.category_id` → `Categories.id` (0..1 : N)
- `Checklist_Items.task_id` → `Tasks.id` (1 : N)

### Data Rules — IMPORTANT

- **IDs**: UUID v4 generated client-side via `crypto.randomUUID()`
- **Soft delete**: set `is_deleted = true`, never remove rows
- **Versioning**: increment `version` field (+1) on every change — used for sync
- **Dates and timestamps**:
  - **Timestamps** (created_at, updated_at, completed_at): ISO 8601 with Z suffix (e.g., `"2025-01-15T10:30:00.000Z"`)
  - **Date-only** (next_date, appear_date): ISO 8601 date format (e.g., `"2025-01-15"`)
  - Frontend: Temporal API (see `frontend/CLAUDE.md`); Backend (GAS): `Date` object
- **Recurring tasks skip logic**: when a user is inactive for a long period, missed copies of recurring tasks are not created — only the nearest future date is calculated. See `.claude/docs/architecture/recurring-tasks-skip-logic.md`
- **Recurring tasks timezone policy**: the current system timezone (`Temporal.Now.timeZoneId()`) is used, not the timezone from when the task was created. This is a deliberate architectural decision for a GTD app. See `.claude/docs/architecture/recurring-tasks-timezone-policy.md`
- **Empty optional fields**: use `""` (empty string), never `null` or `undefined`
- **sort_order**: integer, used for manual ordering within lists

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
| `upload_cover`  | POST   | Upload goal cover image (base64, ≤2MB, SHA-256 dedup)       |
| `upload_covers` | POST   | Batch upload covers (up to 10)                              |
| `get_cover`     | POST   | Download cover images by file_id                            |
| `delete_cover`  | POST   | Delete cover (checks ref_count before actual delete)        |
| `purge`         | POST   | Hard-delete soft-deleted records                            |

### Pull/Push Protocol

**Pull**: client sends `since_revision` (single number) + optional `settings_updated_at`. Server returns all records with `revision > since_revision`. Response includes `current_revision` (`next_revision - 1` from Meta sheet), `purge_revision`, `server_time`. Settings filtered by `updated_at` when `settings_updated_at` provided. Client compares server's `purge_revision` with its local `last_known_purge_revision` — if server's is higher, client hard-deletes local soft-deleted records.

**Push**: client sends arrays of changed records per entity type. Server reads `next_revision` from Meta sheet, assigns it to all accepted records, then increments it. Response statuses: `created`, `accepted`, `conflict` (includes `server_record`), `rejected`. Response includes `revision`, `server_time`. **Conflict resolution: last-write-wins by `updated_at`.**

## Sync Engine

### Flow

1. **App open**: `push` queued changes → `pull` → cover sync
2. **User makes changes**: write to IndexedDB immediately (optimistic UI)
3. **After changes settle**: `push` with debounce (15 seconds)
4. **Periodic**: `pull` every 5 minutes while app is active
5. **Reconnect after offline**: `push` queued changes → `pull` to catch up

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

## Feature Scope

### v1.0

- Task boxes: inbox, today, week, later
- Task CRUD: create, read, update, delete (soft)
- Complete task: swipe right (mobile) or checkbox (desktop)
- Move tasks between boxes
- Goals with statuses and cover images
- Contexts and Categories CRUD
- Sidebar navigation, Goal detail screen, Search
- Default box setting, Accent color
- Full sync with GAS backend, Backend connection setup flow
- Checklists (subtasks within a task)
- Recurring tasks (`repeat_rule`)
- Copy/duplicate task, Configurable creation fields, Menu customization
- Purge
- Quick property panel
 - Focus mode (task dimming by goal/context, configurable opacity)

### v2.0

- Statistics dashboard, Sharing

## Testing Guidelines

- **TDD**: Strict Red-Green-Refactor cycle — see `.claude/docs/tdd-workflow.md`
- Co-locate test files: `Component.test.tsx` next to `Component.tsx`
- Frontend tests: run from `frontend/` directory
- Backend tests: run from `backend/` directory
- See module-level CLAUDE.md files for module-specific testing details