## MODIFIED Requirements

### Requirement: Pull Edge Function uses count exact and ordered queries
The pull Edge Function SHALL use `select("*", { count: "exact" })` for all entity table queries. All queries SHALL include `.order("revision", { ascending: true })`. The function SHALL compute `has_more` and `current_revision` based on truncation detection across all tables.

#### Scenario: Query includes count exact
- **WHEN** pull Edge Function queries the tasks table
- **THEN** the Supabase query uses `select("*", { count: "exact" })`
- **AND** response includes both `data` and `count`

#### Scenario: Query orders by revision ascending
- **WHEN** pull Edge Function queries the tasks table
- **THEN** the query includes `.order("revision", { ascending: true })`

#### Scenario: has_more computed from any truncated table
- **WHEN** tasks count is 1500 but data length is 1000
- **AND** all other tables have count equal to data length
- **THEN** `has_more` is `true`

#### Scenario: current_revision uses MIN of max revisions when truncated
- **WHEN** tasks max revision in batch is 800, goals max revision is 600
- **AND** `has_more` is `true`
- **THEN** `current_revision` is 600
