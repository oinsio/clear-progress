## ADDED Requirements

### Requirement: Unsynced indicator uses needsSync flag
The UI unsynced indicator (amber bar/border) SHALL use `entity.needsSync` to determine visibility. The indicator SHALL NOT use timestamp comparison (`updated_at > lastSyncedAt`).

#### Scenario: Item created during sync cycle retains indicator
- **WHEN** push() collects items A and B with `needsSync = true`
- **AND** item C is created during the sync cycle with `needsSync = true`
- **AND** sync cycle completes, setting `lastSyncedAt` to current time
- **THEN** item C SHALL show the unsynced indicator because `needsSync = true`

#### Scenario: Successfully pushed item loses indicator
- **WHEN** item A is pushed and server returns `created` or `accepted`
- **AND** `needsSync` is set to `false` by push result application
- **THEN** item A SHALL NOT show the unsynced indicator

#### Scenario: Item with needsSync false shows no indicator
- **WHEN** entity has `needsSync = false`
- **THEN** unsynced indicator is not visible regardless of `updated_at` or `lastSyncedAt` values

### Requirement: Checklist unsynced aggregation uses needsSync flag
The `hasUnsyncedItems` computation in the checklist hook SHALL use `item.needsSync` to determine if any checklist items need sync. It SHALL NOT use timestamp comparison.

#### Scenario: One unsynced checklist item flags the task
- **WHEN** a task has 3 checklist items, 1 with `needsSync = true`
- **THEN** `hasUnsyncedItems` is `true`

#### Scenario: All synced checklist items clear the flag
- **WHEN** all checklist items have `needsSync = false`
- **THEN** `hasUnsyncedItems` is `false`
