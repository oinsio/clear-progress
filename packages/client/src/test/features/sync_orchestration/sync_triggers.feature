Feature: Sync Orchestration — Triggers
  Describes when the application initiates a sync cycle (push + pull).
  Each sync cycle executes push then pull sequentially.

  Background:
    Given user is authenticated with a valid token
    And connection config is active
    And navigator is online

  @sync-orchestration @T1
  Scenario: Sync runs on application start
    When SyncProvider mounts
    Then a sync cycle is executed
    And sync status becomes "idle"

  @sync-orchestration @T2
  Scenario: Sync runs periodically
    Given SyncProvider has mounted and initial sync completed
    When 5 minutes pass
    Then a sync cycle is executed

  @sync-orchestration @T2
  Scenario: Periodic sync continues firing
    Given SyncProvider has mounted and initial sync completed
    When 10 minutes pass
    Then 2 periodic sync cycles have executed

  @sync-orchestration @T3
  Scenario: Sync runs after data mutation with debounce
    Given SyncProvider has mounted and initial sync completed
    When user mutates local data
    Then no sync cycle runs immediately
    When 15 seconds pass
    Then a sync cycle is executed

  @sync-orchestration @T3
  Scenario: Multiple mutations within debounce window cause only one sync
    Given SyncProvider has mounted and initial sync completed
    When user mutates local data
    And user mutates local data again after 5 seconds
    Then after 15 seconds from the last mutation a sync cycle is executed
    And only 1 debounced sync cycle ran in total

  @sync-orchestration @T4
  Scenario: Ping fires when browser comes online
    Given SyncProvider has mounted and initial sync completed
    When the browser fires the "online" event
    Then a ping request is sent
    And if ping succeeds a sync cycle follows

  @sync-orchestration @T6
  Scenario: Sync runs when user clicks sync indicator
    Given SyncProvider has mounted and initial sync completed
    When user clicks the sync indicator
    Then a regular sync cycle is executed (push then pull)
    And this is not a full sync (no force push, no revision reset)
