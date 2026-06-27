# Pull Pagination

## Purpose

Keyset pagination for pull sync to handle PostgREST `PGRST_DB_MAX_ROWS` truncation. Ensures all records are fetched across multiple batches using composite cursors `(revision, id)` when any entity table exceeds the row limit.

## Requirements

### Requirement: Server detects PostgREST truncation via count exact
The server SHALL use `select("*", { count: "exact" })` for all entity table queries in pull. The server SHALL determine `has_more = true` when `count > data.length` for ANY table in the response.

#### Scenario: No truncation when all records fit in one batch
- **WHEN** user has 50 tasks and PostgREST `max_rows` is 1000
- **THEN** `count` equals `data.length` for tasks
- **AND** `has_more` is `false`

#### Scenario: Truncation detected when records exceed max_rows
- **WHEN** user has 1500 tasks and PostgREST `max_rows` is 1000
- **THEN** `count` is 1500 and `data.length` is 1000 for tasks
- **AND** `has_more` is `true`

#### Scenario: Truncation in any table triggers has_more
- **WHEN** user has 50 tasks but 1500 checklist items and `max_rows` is 1000
- **THEN** `has_more` is `true` (because checklist_items truncated)

### Requirement: Server orders pull results by revision and id ascending
The server SHALL apply `ORDER BY revision ASC, id ASC` to all entity table queries in pull. The composite sort ensures deterministic ordering for keyset pagination when multiple records share the same revision.

#### Scenario: Records ordered by revision then id
- **WHEN** server pulls tasks with revisions [5, 3, 5, 1] and ids [d, b, a, c]
- **THEN** response contains tasks ordered as [(1,c), (3,b), (5,a), (5,d)]

### Requirement: Server returns per-table composite cursor for truncated tables
When `has_more` is `true`, the server SHALL return a `cursors` object containing `{ revision, last_id }` for each truncated table (where `count > data.length`). Non-truncated tables SHALL NOT have a cursor entry. The server SHALL also set `current_revision` to `MIN(max_revision)` across all tables with data. When `has_more` is `false`, the server SHALL set `current_revision` to `next_revision - 1` and omit `cursors`.

#### Scenario: Cursor returned only for truncated table
- **WHEN** tasks has count=15 data.length=10 (truncated), goals has count=3 data.length=3
- **AND** `has_more` is `true`
- **THEN** `cursors` contains entry for `tasks` with revision and last_id of the 10th task
- **AND** `cursors` does NOT contain entry for `goals`

#### Scenario: current_revision is MIN of max revisions when has_more
- **WHEN** tasks batch max revision is 500, goals batch max revision is 300
- **AND** `has_more` is `true`
- **THEN** `current_revision` is 300

#### Scenario: current_revision is next_revision minus 1 when no more data
- **WHEN** `has_more` is `false` and `next_revision` is 1001
- **THEN** `current_revision` is 1000

#### Scenario: Tables with no data are excluded from MIN calculation
- **WHEN** tasks batch max revision is 500, goals return no data
- **AND** `has_more` is `true`
- **THEN** `current_revision` is 500 (goals excluded from MIN)

### Requirement: Server uses composite cursor filter for tables with cursor in request
When a pull request includes a `cursors` entry for a table, the server SHALL use a composite `.or()` filter: `revision.gt.R,and(revision.eq.R,id.gt.ID)` instead of `gt("revision", since_revision)`. Tables without a cursor in the request SHALL use the standard `gt("revision", since_revision)` filter.

#### Scenario: Composite filter resumes from cursor position
- **GIVEN** 15 tasks with revision=5, max_rows=10
- **WHEN** first page returns 10 tasks ordered by (revision, id)
- **AND** cursor is `{ revision: 5, last_id: "task-10-id" }`
- **THEN** second page with composite filter returns remaining 5 tasks with revision=5 and id > "task-10-id"

#### Scenario: Table without cursor uses standard gt filter
- **WHEN** request has cursor for tasks but not for goals
- **THEN** tasks query uses `.or('revision.gt.R,and(revision.eq.R,id.gt.ID)')`
- **AND** goals query uses `.gt("revision", since_revision)`

### Requirement: PullRequest includes optional cursors field
The `PullRequest` type SHALL include an optional `cursors: Record<string, { revision: number; last_id: string }>` field. When present, the server uses composite cursor filters for the specified tables.

#### Scenario: First pull request has no cursors
- **WHEN** client sends initial pull request
- **THEN** request contains `since_revision` but no `cursors`

#### Scenario: Subsequent pull request includes cursors from previous response
- **WHEN** previous response had `has_more=true` and `cursors: { tasks: { revision: 5, last_id: "xyz" } }`
- **THEN** next request includes `cursors: { tasks: { revision: 5, last_id: "xyz" } }`

### Requirement: Client pagination loop with cursor passthrough
The client SHALL execute a `do/while` loop calling `pull(since_revision, cursors)`, applying entities from each batch, and passing `cursors` from the response to the next request. The loop SHALL continue while `has_more` is `true`.

#### Scenario: Single batch when no pagination needed
- **WHEN** server returns `has_more = false` on first call
- **THEN** client makes exactly 1 pull request without cursors

#### Scenario: Multiple batches with cursor passthrough
- **WHEN** server returns `has_more = true` with cursors on first call
- **AND** server returns `has_more = false` on second call
- **THEN** client makes exactly 2 pull requests
- **AND** second request includes cursors from first response

#### Scenario: All records from same revision fetched via composite cursor
- **WHEN** 15 tasks share revision=5 and max_rows=10
- **THEN** first batch returns 10 tasks with cursor
- **AND** second batch returns remaining 5 tasks
- **AND** all 15 tasks are applied to local storage

### Requirement: Client saves revision only after pagination completes
The client SHALL save `last_known_revision` ONLY after receiving a response with `has_more === false`. During pagination, intermediate `current_revision` values SHALL NOT be persisted.

#### Scenario: Revision saved after complete pagination
- **WHEN** pagination completes with final `current_revision = 1500`
- **THEN** `last_known_revision` is saved as 1500

#### Scenario: Crash during pagination does not lose data
- **WHEN** client crashes after first batch (revision 500) but before saving
- **THEN** next sync starts from previously saved `last_known_revision` (e.g., 0)
- **AND** all records are re-fetched correctly (no cursors on fresh start)

### Requirement: PullResponse includes has_more and cursors fields
The `PullResponse` contract type SHALL include `has_more: boolean` and optional `cursors: Record<string, { revision: number; last_id: string }>` fields.

#### Scenario: PullResponse with has_more true and cursors
- **WHEN** server detects truncation in tasks table
- **THEN** response includes `has_more: true` and `cursors: { tasks: { revision, last_id } }`

#### Scenario: PullResponse with has_more false and no cursors
- **WHEN** server returns all matching records
- **THEN** response includes `has_more: false` and no `cursors` field

### Requirement: Composite index for keyset pagination
A composite index `(user_id, revision, id)` SHALL exist on all 7 entity tables (tasks, goals, ideas, contexts, categories, checklist_items, attachments) to support efficient keyset pagination with the composite cursor.

#### Scenario: Composite cursor query uses index
- **WHEN** pull query uses `.or('revision.gt.R,and(revision.eq.R,id.gt.ID)')` with `.order("revision").order("id")`
- **THEN** query uses the composite index for O(1) seek
