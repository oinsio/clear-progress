## REMOVED Requirements

### Requirement: Get settings changed since timestamp

The system SHALL provide a method to retrieve settings with `updated_at` strictly greater than a given timestamp.

#### Scenario: Filter settings by updated_at
- **WHEN** setting A has `updated_at: "2025-01-01T00:00:00.000Z"` and setting B has `updated_at: "2025-01-02T00:00:00.000Z"`
- **AND** `getChangedSince("2025-01-01T00:00:00.000Z")` is called
- **THEN** only setting B is returned

**Reason**: The `getChangedSince` delta-sync query is dead code — no production code path calls it. Sync reconciliation is handled entirely by `getNeedingSync()` (local dirty records) and `applyServerRecords()` (pull + LWW), so a "changed since timestamp" query is not part of the active sync protocol. Implements FR2 of remove-unused-get-changed-since.

**Migration**: None. No caller consumes this capability. Code needing changed records should use `getNeedingSync()` for locally-dirty records; server reconciliation goes through `applyServerRecords()`.
