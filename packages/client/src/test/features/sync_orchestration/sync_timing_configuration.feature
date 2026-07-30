Feature: Sync Orchestration — Configurable Timing
  Describes how the periodic sync trigger (T2) and the debounced push trigger
  (T3) use configurable, cross-device-synced timing instead of fixed
  constants, including timing values that arrive via a pull.
  Implements FR3, FR4 of configurable-sync-timing.

  Background:
    Given user is authenticated with a valid token
    And connection config is active
    And navigator is online

  @configurable-sync-timing @FR3
  Scenario: Periodic sync uses a configured non-default interval
    Given sync_interval is configured to 2 minutes
    And SyncProvider has mounted and initial sync completed
    When 2 minutes pass
    Then a sync cycle is executed

  @configurable-sync-timing @FR3
  Scenario: Periodic sync is disabled when sync_interval is empty
    Given sync_interval is configured to empty (disabled)
    And SyncProvider has mounted and initial sync completed
    When 24 hours pass
    Then no periodic sync cycle executes

  @configurable-sync-timing @FR3 @D7
  Scenario: Periodic interval updates after a pull delivers a new sync_interval value
    Given sync_interval is configured to 2 minutes
    And SyncProvider has mounted and initial sync completed
    When a sync cycle pulls a new sync_interval value of 4 minutes
    Then the stale 2 minute cadence no longer triggers a sync
    And periodic sync now follows the new 4 minute cadence

  @configurable-sync-timing @FR4
  Scenario: Debounced sync uses a configured non-default delay
    Given auto_sync_delay is configured to 3 seconds
    And SyncProvider has mounted and initial sync completed
    When user mutates local data
    Then no sync cycle runs immediately
    When 3 seconds pass
    Then a sync cycle is executed

  @configurable-sync-timing @FR4
  Scenario: Debounced sync fires immediately when auto_sync_delay is 0
    Given auto_sync_delay is configured to 0 seconds
    And SyncProvider has mounted and initial sync completed
    When user mutates local data
    Then a sync cycle is executed

  @configurable-sync-timing @FR4 @D7
  Scenario: Debounce delay updates after a pull delivers a new auto_sync_delay value
    Given auto_sync_delay is configured to 30 seconds
    And SyncProvider has mounted and initial sync completed
    When a sync cycle pulls a new auto_sync_delay value of 5 seconds
    And user mutates local data
    Then no sync cycle runs immediately
    When 5 seconds pass
    Then a sync cycle is executed
