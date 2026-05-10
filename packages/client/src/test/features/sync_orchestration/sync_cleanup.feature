Feature: Sync Orchestration — Cleanup
  Describes timer and listener cleanup on unmount.

  Background:
    Given user is authenticated with a valid token
    And connection config is active
    And navigator is online

  @sync-orchestration @cleanup
  Scenario: All timers are cleared on unmount
    Given SyncProvider has mounted and initial sync completed
    When SyncProvider unmounts
    Then periodic sync interval is cleared
    And no more periodic syncs fire

  @sync-orchestration @cleanup
  Scenario: Ping interval is cleared on unmount
    Given navigator is offline
    And SyncProvider has mounted
    And ping interval is active
    When SyncProvider unmounts
    Then no more pings fire

  @sync-orchestration @cleanup
  Scenario: Debounce timer is cleared on unmount without triggering sync
    Given SyncProvider has mounted and initial sync completed
    And user has called schedulePush (debounce timer pending)
    When SyncProvider unmounts
    And 15 seconds pass
    Then no sync cycle runs
