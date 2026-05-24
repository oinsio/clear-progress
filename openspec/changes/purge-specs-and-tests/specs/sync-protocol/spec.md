## MODIFIED Requirements

### Requirement: Purge hard-deletes soft-deleted records
The `purge()` operation SHALL hard-delete all records with `is_deleted = true` from the server and increment `purge_revision`. Server-side validation, response structure, and deletion behavior are specified in the `purge` capability spec (`openspec/specs/purge/spec.md`).

#### Scenario: Server purge removes soft-deleted records
- **WHEN** `purge()` is called
- **THEN** server removes all records where `is_deleted = true`
- **AND** returns counts per entity type and new `purge_revision`

#### Scenario: Client detects server purge via pull
- **WHEN** pull response has `purge_revision` > client's `last_known_purge_revision`
- **THEN** client hard-deletes all local records with `is_deleted = true`
- **AND** updates `last_known_purge_revision`

#### Scenario: Client purge removes local soft-deleted records
- **WHEN** client calls `purge()`
- **THEN** after server purge completes, client hard-deletes local `is_deleted = true` records
- **AND** pulls to sync state
