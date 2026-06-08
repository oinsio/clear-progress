Feature: Sync Orchestration — Error Handling
  Describes how the application handles different error types during sync.

  Background:
    Given user is authenticated with a valid token
    And connection config is active
    And navigator is online

  @sync-orchestration @error-handling
  Scenario: Network error sets error status
    Given SyncProvider has mounted and initial sync completed
    When periodic sync fails with a network error
    Then sync status becomes "error"

  @sync-orchestration @error-handling
  Scenario: First auth error triggers silent refresh
    When SyncProvider mounts
    And sync fails with an auth error
    Then silentRefresh() is called
    And signOut() is not called
    And sync status becomes "unauthorized"

  @sync-orchestration @error-handling
  Scenario: Repeated auth errors trigger sign out
    When SyncProvider mounts
    And sync fails with an auth error MAX_SILENT_REFRESH_ATTEMPTS times
    Then signOut() is called
    And AUTH_REQUIRED_EVENT is dispatched

  @sync-orchestration @error-handling
  Scenario: Auth error counter resets after successful sync
    Given sync has failed with 1 auth error and silentRefresh was called
    When next sync succeeds
    And then sync fails with an auth error again
    Then silentRefresh() is called (not signOut)
    And the counter starts from 1 again

  @sync-orchestration @error-handling
  Scenario: File sync error does not fail the sync cycle
    Given SyncProvider has mounted
    When push and pull succeed but file sync throws an error
    Then sync status becomes "idle"
    And syncVersion is incremented
