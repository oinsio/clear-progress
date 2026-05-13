## MODIFIED Requirements

### Requirement: Client applies push results
After receiving push results, the client SHALL apply them according to status.

#### Scenario: Created/accepted clears dirty flag if unchanged
- **WHEN** push result is `created` or `accepted`
- **AND** local record's `updated_at` has not changed since push was sent
- **THEN** set `needsSync = false`

#### Scenario: Created/accepted keeps dirty flag if changed locally
- **WHEN** push result is `created` or `accepted`
- **AND** local record's `updated_at` changed since push was sent (concurrent local edit)
- **THEN** keep `needsSync = true`

#### Scenario: Conflict overwrites local record
- **WHEN** push result is `conflict`
- **THEN** local record is overwritten with `server_record`
- **AND** `needsSync` is set to `false`

#### Scenario: Rejected records are kept for retry
- **WHEN** push result is `rejected`
- **THEN** local record is not changed
- **AND** `needsSync` remains `true`

### Requirement: Dirty flag lifecycle
The `needsSync` flag SHALL be set to `true` only when entity data actually changes. The system SHALL compare field values using `hasEntityChanged()`, ignoring `id`, `updated_at`, `created_at`, `needsSync`, `revision`. Empty values (`""`, `undefined`, `null`) SHALL be treated as equal.

#### Scenario: Real change sets dirty flag
- **WHEN** user changes task name from "Buy milk" to "Buy bread"
- **THEN** `needsSync` is set to `true`

#### Scenario: No-op change does not set dirty flag
- **WHEN** user opens edit dialog and saves without changes
- **THEN** `needsSync` remains unchanged

#### Scenario: Empty string equals undefined in comparison
- **WHEN** field has value `""` on one side and `undefined` on the other
- **THEN** `hasEntityChanged()` treats them as equal

### Requirement: Soft delete marks records without removing
Deleting a record SHALL set `is_deleted = true`. The record SHALL be pushed to the server with the delete flag. No physical deletion occurs until purge.

#### Scenario: Delete sets flag and syncs
- **WHEN** user deletes a task
- **THEN** task has `is_deleted = true`, `needsSync = true`

#### Scenario: Deleted records are included in push
- **WHEN** push collects dirty records
- **THEN** records with `is_deleted = true` and `needsSync = true` are included
