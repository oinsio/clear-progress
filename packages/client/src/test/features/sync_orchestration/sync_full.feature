Feature: Sync Orchestration — Full Sync (Manual)
  Describes the user-initiated full synchronization from settings.

  Background:
    Given user is authenticated with a valid token
    And connection config is active
    And navigator is online
    And SyncProvider has mounted and initial sync completed

  @sync-orchestration @T7
  Scenario: Full sync executes all steps in order
    When user triggers full sync
    Then progress reports steps in order:
      | step             |
      | reupload_files  |
      | upload_files    |
      | push             |
      | pull             |
      | download_files  |
      | done             |

  @sync-orchestration @T7
  Scenario: Full sync uses force push and reset pull
    When user triggers full sync
    Then push(force=true) is called
    And resetAndPull() is called

  @sync-orchestration @T7
  Scenario: Full sync increments sync version on success
    Given syncVersion is N
    When user triggers full sync successfully
    Then syncVersion becomes N+1

  @sync-orchestration @T7
  Scenario: Full sync reports error on failure
    When user triggers full sync
    And resetAndPull fails
    Then progress reports "error"
    And sync status becomes "error"

  @sync-orchestration @T7
  Scenario: Full sync is blocked by active regular sync
    Given a regular sync cycle is in progress
    When user triggers full sync
    Then full sync does not start
