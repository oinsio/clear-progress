Feature: Sync Protocol — Indicator Race Condition
  Implements fix-sync-indicator-race: unsynced indicator uses needsSync flag
  instead of timestamp comparison to avoid race conditions during sync.

  @fix-sync-indicator-race @FR1
  Scenario: Entity with needsSync true shows as unsynced
    Given an entity with needsSync set to true
    Then the entity is considered unsynced

  @fix-sync-indicator-race @FR1
  Scenario: Entity with needsSync false shows as synced
    Given an entity with needsSync set to false
    Then the entity is considered synced

  @fix-sync-indicator-race @FR4
  Scenario: Item created during sync retains unsynced indicator
    Given items A and B were collected for push with needsSync true
    And item C is created during the sync cycle with needsSync true
    And sync completes setting lastSyncedAt to current time
    Then item C is considered unsynced because needsSync is true

  @fix-sync-indicator-race @FR3
  Scenario: One unsynced checklist item flags the task
    Given a task has 3 checklist items where 1 has needsSync true
    Then hasUnsyncedItems is true

  @fix-sync-indicator-race @FR3
  Scenario: All synced checklist items clear the flag
    Given a task has 3 checklist items all with needsSync false
    Then hasUnsyncedItems is false
