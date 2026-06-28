## MODIFIED Requirements

### Requirement: Pull Edge Function uses count exact, composite ordering, and per-table cursor
The pull Edge Function SHALL use `select("*", { count: "exact" })` for all entity table queries. All queries SHALL include `.order("revision", { ascending: true }).order("id", { ascending: true })`. When the request includes `cursors` for a table, the query SHALL use `.or('revision.gt.R,and(revision.eq.R,id.gt.ID)')` instead of `.gt("revision", since_revision)`. The function SHALL compute `has_more`, `current_revision`, and `cursors` for truncated tables.

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
