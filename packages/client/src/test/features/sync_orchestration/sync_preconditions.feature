Feature: Sync Orchestration — Preconditions (Gates)
  Describes conditions that prevent a sync cycle from running.

  @sync-orchestration @precondition
  Scenario: Sync is skipped when user is not authenticated
    Given user has no access token
    When SyncProvider mounts
    Then no sync cycle runs
    And no periodic interval is started

  @sync-orchestration @precondition
  Scenario: Sync sets offline status when navigator is offline
    Given user is authenticated with a valid token
    And connection config is active
    And navigator is offline
    When SyncProvider mounts
    Then no sync cycle runs
    And sync status becomes "offline"

  @sync-orchestration @precondition
  Scenario: Concurrent sync is dropped by mutex
    Given user is authenticated with a valid token
    And connection config is active
    And navigator is online
    And a sync cycle is already in progress
    When another sync trigger fires
    Then the second sync is skipped (not queued)
