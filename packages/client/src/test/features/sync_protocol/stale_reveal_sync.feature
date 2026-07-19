Feature: Stale-Safe Reveal Sync
  Implements FR1 of fix-stale-sync-overwrites.

  @fix-stale-sync-overwrites @FR1
  Scenario: Task revealed when appear date arrives preserves updated_at
    Given a hidden task with appear_date "2026-06-15", updated_at "2026-06-01T10:00:00.000Z" and today is "2026-06-15"
    When system reveals hidden tasks
    Then the task has is_hidden false and syncStatus "pending"
    And the task's updated_at is still "2026-06-01T10:00:00.000Z"

  @fix-stale-sync-overwrites @FR1
  Scenario: Reveal of an already-pending record does not degrade its state
    Given a hidden task with appear_date "2026-06-15", updated_at "2026-06-01T10:00:00.000Z", syncStatus "pending" and today is "2026-06-15"
    When system reveals hidden tasks
    Then the task has is_hidden false and syncStatus "pending"
    And the task's updated_at is still "2026-06-01T10:00:00.000Z"

  @fix-stale-sync-overwrites @FR2
  Scenario: Manual hide sets appear_date, refreshes updated_at, and marks pending for sync
    Given a visible task with updated_at "2026-06-01T10:00:00.000Z" and syncStatus "synced"
    When the user manually hides the task with appear_date "2026-08-01"
    Then the task has is_hidden true and appear_date "2026-08-01"
    And the task's updated_at is refreshed past "2026-06-01T10:00:00.000Z"
    And the task has syncStatus "pending"

  @fix-stale-sync-overwrites @FR2
  Scenario: Manual unhide before appear date clears appear_date, refreshes updated_at, and marks pending for sync
    Given a hidden task with appear_date "2026-08-01", updated_at "2026-06-01T10:00:00.000Z" and syncStatus "synced"
    When the user manually unhides the task
    Then the task has is_hidden false and appear_date ""
    And the task's updated_at is refreshed past "2026-06-01T10:00:00.000Z"
    And the task has syncStatus "pending"
