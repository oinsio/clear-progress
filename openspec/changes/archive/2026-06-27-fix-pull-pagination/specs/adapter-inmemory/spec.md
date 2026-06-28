## MODIFIED Requirements

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
