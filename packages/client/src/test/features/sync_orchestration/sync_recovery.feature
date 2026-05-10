Feature: Sync Orchestration — Recovery
  Describes how the application recovers from offline/error states.

  Background:
    Given user is authenticated with a valid token
    And connection config is active

  @sync-orchestration @T5
  Scenario: Ping interval starts when sync fails with network error
    Given navigator is online
    When SyncProvider mounts
    And sync fails with a network error
    Then sync status becomes "error"
    And ping interval starts (every 30 seconds)

  @sync-orchestration @T5
  Scenario: Ping interval starts when navigator is offline at mount
    Given navigator is offline
    When SyncProvider mounts
    Then sync status becomes "offline"
    And ping interval starts (every 30 seconds)

  @sync-orchestration @T5
  Scenario: Successful ping triggers sync and stops interval
    Given ping interval is active
    When ping succeeds with initialized=true
    Then a sync cycle is executed
    And ping interval is stopped
    And no further pings fire

  @sync-orchestration @T5
  Scenario: Ping calls init when server reports not initialized
    Given ping interval is active
    When ping succeeds with initialized=false
    Then init() is called
    And a sync cycle follows

  @sync-orchestration @T5
  Scenario: Failed ping continues the interval
    Given ping interval is active
    When ping fails
    Then ping interval continues
    And next ping fires after 30 seconds

  @sync-orchestration @T5
  Scenario: Ping stops after max attempts
    Given ping interval is active
    When ping fails MAX_PING_ATTEMPTS times consecutively
    Then ping interval is stopped
    And no further pings fire
