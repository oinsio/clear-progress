## MODIFIED Requirements

### Composite cursor format

Per-table composite cursor used for keyset pagination when a table is truncated by PostgREST `PGRST_DB_MAX_ROWS`.

```typescript
/** Composite cursor for a single entity table. */
interface TableCursor {
  /** Revision of the last record on the previous page. */
  revision: number;
  /** UUID id of the last record on the previous page (tiebreaker). */
  last_id: string;
}

/**
 * Map of entity table name to its composite cursor.
 * Only truncated tables have an entry.
 * Valid keys: "tasks" | "goals" | "ideas" | "contexts"
 *           | "categories" | "checklist_items" | "attachments"
 * Settings are excluded — see "Settings and pagination" below.
 */
type Cursors = Record<string, TableCursor>;
```

**PullRequest** — extended fields:
```json
{
  "since_revision": 5,
  "cursors": {
    "tasks": { "revision": 5, "last_id": "a1b2c3d4-..." }
  }
}
```
- `cursors` is optional. Omitted on first pull and after crash recovery.
- Each entry tells the server to resume that table from the composite position `(revision, last_id)` using keyset filter `revision > R OR (revision = R AND id > ID)`.
- Tables not listed in `cursors` use the standard `gt("revision", since_revision)` filter.

**PullResponse** — extended fields:
```json
{
  "has_more": true,
  "current_revision": 5,
  "cursors": {
    "tasks": { "revision": 5, "last_id": "a1b2c3d4-..." }
  }
}
```
- `cursors` is present only when `has_more` is `true`.
- Contains entries only for truncated tables (`count > data.length`).
- `revision` and `last_id` are taken from the last row of the truncated table's result set (ordered by `revision ASC, id ASC`).
- Client passes this `cursors` object back in the next PullRequest.

**Multi-table examples:**

Single truncated table (tasks) — only tasks gets a cursor:
```json
{
  "has_more": true,
  "current_revision": 5,
  "cursors": {
    "tasks": { "revision": 5, "last_id": "d4e5f6a7-1234-5678-9abc-def012345678" }
  },
  "tasks": ["... 10 records ..."],
  "goals": ["... 3 records (all fit) ..."],
  "checklist_items": []
}
```

Multiple truncated tables (tasks + checklist_items) — both get cursors:
```json
{
  "has_more": true,
  "current_revision": 3,
  "cursors": {
    "tasks":           { "revision": 5, "last_id": "d4e5f6a7-1234-5678-9abc-def012345678" },
    "checklist_items": { "revision": 3, "last_id": "b2c3d4e5-aaaa-bbbb-cccc-ddddeeee1111" }
  }
}
```
Here `current_revision = MIN(5, 3) = 3`. On the next request, `since_revision = 3`, tasks and checklist_items use their respective composite cursors, and all other tables use `gt("revision", 3)`.

Request resuming from the above response:
```json
{
  "since_revision": 3,
  "cursors": {
    "tasks":           { "revision": 5, "last_id": "d4e5f6a7-1234-5678-9abc-def012345678" },
    "checklist_items": { "revision": 3, "last_id": "b2c3d4e5-aaaa-bbbb-cccc-ddddeeee1111" }
  }
}
```
Server query logic per table:
- `tasks` — `.or('revision.gt.5,and(revision.eq.5,id.gt.d4e5f6a7-...)')` (has cursor)
- `checklist_items` — `.or('revision.gt.3,and(revision.eq.3,id.gt.b2c3d4e5-...)')` (has cursor)
- `goals`, `ideas`, `contexts`, `categories`, `attachments` — `.gt("revision", 3)` (no cursor, use since_revision)

Final page — no cursors:
```json
{
  "has_more": false,
  "current_revision": 8
}
```

### Settings and pagination

Settings are excluded from composite cursor pagination:
- Settings have no `revision` column — they use `updated_at` for change tracking
- Settings have no UUID `id` column — they are keyed by `(user_id, key)`
- Settings are queried separately: `select("*").eq("user_id", userId).gt("updated_at", settingsUpdatedAt)`
- Settings are excluded from `has_more` computation (not in `entityResults`)
- **Truncation risk is negligible:** settings are key-value pairs with a fixed set of application-defined keys (tens, not thousands). The count cannot exceed `PGRST_DB_MAX_ROWS` in practice.

### Requirement: Pull fetches server changes since last known revision
The system SHALL fetch all records with `revision > since_revision` from the server via `pull(PullRequest)`. The request MAY include `cursors` with per-table composite cursor `{ revision, last_id }` for resuming pagination from a previous truncated response. The response SHALL include `has_more: boolean` and optional `cursors` for truncated tables. When `has_more` is `true`, the client SHALL repeat the pull using `current_revision` as the new `since_revision` and passing `cursors` from the response. The client SHALL save `last_known_revision` ONLY after receiving `has_more === false`.

#### Scenario: Regular pull fetches changes since last revision
- **WHEN** client has `last_known_revision = 5` and server has records at revisions 6, 7, 8
- **THEN** PullRequest contains `since_revision = 5` without cursors
- **AND** response contains records at revisions 6, 7, 8

#### Scenario: Pull with composite cursor pagination fetches all changes
- **WHEN** client has `last_known_revision = 0` and server has 15 tasks all at revision 5
- **AND** PostgREST `max_rows` is 10
- **THEN** client makes 2 pull requests
- **AND** second request includes cursors from first response
- **AND** all 15 tasks are applied locally
- **AND** `last_known_revision` is saved only after second response

#### Scenario: Pull with same-revision records does not lose data
- **WHEN** push created 15 records all with revision=5
- **AND** max_rows is 10
- **THEN** first page returns 10 records with composite cursor for the truncated table
- **AND** second page uses composite cursor to fetch remaining 5 records
- **AND** no records are lost

#### Scenario: Interrupted pagination resumes safely
- **WHEN** client crashes after applying first batch
- **THEN** `last_known_revision` was not updated
- **AND** next sync re-fetches from the same starting revision without cursors
