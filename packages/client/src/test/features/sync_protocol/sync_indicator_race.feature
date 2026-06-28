Feature: Sync Protocol — Indicator Race Condition
  Implements fix-sync-indicator-race: unsynced indicator uses syncStatus flag
  instead of timestamp comparison to avoid race conditions during sync.

  @fix-sync-indicator-race @FR1
  Scenario: Entity with syncStatus "pending" shows as unsynced
    Given an entity with syncStatus set to "pending"
    Then the entity is considered unsynced

  @fix-sync-indicator-race @FR1
  Scenario: Entity with syncStatus "synced" shows as synced
    Given an entity with syncStatus set to "synced"
    Then the entity is considered synced

  @fix-sync-indicator-race @FR4
  Scenario: Item created during sync retains unsynced indicator
    Given items A and B were collected for push with syncStatus "pending"
    And item C is created during the sync cycle with syncStatus "pending"
    And sync completes setting lastSyncedAt to current time
    Then item C is considered unsynced because syncStatus is "pending"

  @fix-sync-indicator-race @FR3
  Scenario: One unsynced checklist item flags the task
    Given a task has 3 checklist items where 1 has syncStatus "pending"
    Then hasUnsyncedItems is true

  @fix-sync-indicator-race @FR3
  Scenario: All synced checklist items clear the flag
    Given a task has 3 checklist items all with syncStatus "synced"
    Then hasUnsyncedItems is false
