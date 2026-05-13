Feature: Sync Protocol — Soft Delete and Purge
  Implements spec-sync-protocol soft delete and purge scenarios:
  deleted records included in push, server purge detection via
  pull, and local purge cleanup.

  @spec-sync-protocol @FR6
  Scenario: Deleted records are included in push
    Given client has a task with is_deleted true and needsSync true
    When push is called
    Then PushRequest contains the deleted task

  @spec-sync-protocol @FR6
  Scenario: Pull detects server purge and cleans local records
    Given client has local records with is_deleted true
    And last_known_purge_revision is 2
    And server will respond to pull with purge_revision 3
    When pull is called
    Then local soft-deleted records are hard-deleted
    And last_known_purge_revision is set to 3

  @spec-sync-protocol @FR6
  Scenario: Pull does not purge when purge_revision unchanged
    Given client has local records with is_deleted true
    And last_known_purge_revision is 2
    And server will respond to pull with purge_revision 2
    When pull is called
    Then local soft-deleted records are not hard-deleted

  @spec-sync-protocol @FR6
  Scenario: Client purge calls server and cleans local records
    Given client has local records with is_deleted true
    And server purge will succeed with purge_revision 5
    When purge is called
    Then server purge API is called
    And local soft-deleted records are hard-deleted
    And last_known_purge_revision is set to 5
    And pull is executed after purge

  @spec-sync-protocol @FR6
  Scenario: Purge does not delete records that are not soft-deleted
    Given client has task "t1" with is_deleted false
    And client has task "t2" with is_deleted true
    And server purge will succeed with purge_revision 5
    When purge is called
    Then task "t1" still exists
    And task "t2" is hard-deleted

  @spec-sync-protocol @FR6 @FR14
  Scenario: Full sync resets needsSync to false before pulling
    Given client has task "t1" with needsSync true
    And server will respond to pull with tasks
    When resetAndPull is called
    Then task "t1" has needsSync false before pull executes
