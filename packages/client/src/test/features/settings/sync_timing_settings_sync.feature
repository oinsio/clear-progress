Feature: Sync timing settings follow the generic settings sync path
  Implements FR5 of configurable-sync-timing.

  @configurable-sync-timing @FR5
  Scenario: Get sync_interval and auto_sync_delay when needing sync
    Given "sync_interval" and "auto_sync_delay" have syncStatus "pending" and "accent_color" has syncStatus "synced"
    When getNeedingSync is called
    Then only "sync_interval" and "auto_sync_delay" are returned

  @configurable-sync-timing @FR5
  Scenario: Clear sync flag for sync_interval after push
    Given a local setting with key "sync_interval" and syncStatus "pending"
    When clearNeedsSyncByKey is called with keys ["sync_interval"]
    Then "sync_interval" has syncStatus "synced"

  @configurable-sync-timing @FR5
  Scenario: Accept newer pulled sync_interval value
    Given a local setting with key "sync_interval", value "5", updated_at "2025-01-01T00:00:00.000Z", and syncStatus "synced"
    When bulkUpsert receives "sync_interval" with value "30" and updated_at "2025-01-02T00:00:00.000Z"
    Then the local setting "sync_interval" is updated to value "30"

  @configurable-sync-timing @FR5
  Scenario: Local-dirty auto_sync_delay wins over pulled value
    Given a local setting with key "auto_sync_delay", value "10", and syncStatus "pending"
    When bulkUpsert receives "auto_sync_delay" with value "60"
    Then the local setting "auto_sync_delay" remains with value "10"

  @configurable-sync-timing @FR5
  Scenario: Round-trip an empty (disabled) sync_interval value through bulkUpsert
    Given no local setting with key "sync_interval" exists
    When bulkUpsert receives "sync_interval" with value ""
    Then a new setting is created with key "sync_interval" and value ""
    And the setting "sync_interval" has syncStatus "synced"
