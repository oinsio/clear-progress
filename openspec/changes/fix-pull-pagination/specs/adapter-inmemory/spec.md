## MODIFIED Requirements

### Requirement: In-memory adapter supports pull pagination
The in-memory adapter SHALL support a configurable `maxRowsPerTable` parameter. When the number of matching records in any table exceeds `maxRowsPerTable`, the adapter SHALL return only `maxRowsPerTable` records (ordered by revision ASC), set `has_more = true`, and compute `current_revision` as `MIN(max_revision)` across tables with data.

#### Scenario: No pagination when records fit within limit
- **WHEN** `maxRowsPerTable` is 100 and table has 50 matching records
- **THEN** all 50 records are returned
- **AND** `has_more` is `false`

#### Scenario: Pagination triggered when records exceed limit
- **WHEN** `maxRowsPerTable` is 10 and table has 25 matching records
- **THEN** first pull returns 10 records with `has_more = true`
- **AND** `current_revision` equals the max revision of those 10 records

#### Scenario: Multiple pagination rounds return all records
- **WHEN** `maxRowsPerTable` is 10 and table has 25 matching records
- **THEN** 3 pull requests return all 25 records (10 + 10 + 5)
- **AND** last response has `has_more = false`
