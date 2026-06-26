## ADDED Requirements

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

### Requirement: Server orders pull results by revision ascending
The server SHALL apply `ORDER BY revision ASC` to all entity table queries in pull.

#### Scenario: Records ordered by revision
- **WHEN** server pulls tasks with revisions [5, 3, 7, 1]
- **THEN** response contains tasks ordered as [1, 3, 5, 7]

### Requirement: Server computes current_revision as MIN of max revisions when paginating
When `has_more` is `true`, the server SHALL set `current_revision` to the `MIN` of the maximum revision across all tables that returned data. When `has_more` is `false`, the server SHALL set `current_revision` to `next_revision - 1`.

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

### Requirement: Client pagination loop
The client SHALL execute a `do/while` loop calling `pull(since_revision)`, applying entities from each batch, and using `current_revision` as the next `since_revision`. The loop SHALL continue while `has_more` is `true`.

#### Scenario: Single batch when no pagination needed
- **WHEN** server returns `has_more = false` on first call
- **THEN** client makes exactly 1 pull request

#### Scenario: Multiple batches when pagination needed
- **WHEN** server returns `has_more = true` on first call and `has_more = false` on second
- **THEN** client makes exactly 2 pull requests
- **AND** second request uses `current_revision` from first response as `since_revision`

#### Scenario: Entities from each batch are applied immediately
- **WHEN** first batch contains 1000 tasks and second batch contains 500 tasks
- **THEN** all 1500 tasks are applied to local storage

### Requirement: Client saves revision only after pagination completes
The client SHALL save `last_known_revision` ONLY after receiving a response with `has_more === false`. During pagination, intermediate `current_revision` values SHALL NOT be persisted.

#### Scenario: Revision saved after complete pagination
- **WHEN** pagination completes with final `current_revision = 1500`
- **THEN** `last_known_revision` is saved as 1500

#### Scenario: Crash during pagination does not lose data
- **WHEN** client crashes after first batch (revision 500) but before saving
- **THEN** next sync starts from previously saved `last_known_revision` (e.g., 0)
- **AND** all records are re-fetched correctly

### Requirement: PullResponse includes has_more field
The `PullResponse` contract type SHALL include a `has_more: boolean` field indicating whether more data is available.

#### Scenario: PullResponse with has_more true
- **WHEN** server detects truncation
- **THEN** response includes `has_more: true`

#### Scenario: PullResponse with has_more false
- **WHEN** server returns all matching records
- **THEN** response includes `has_more: false`
