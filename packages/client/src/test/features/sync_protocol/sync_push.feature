Feature: Sync Protocol — Push
  Implements spec-sync-protocol push scenarios: collecting dirty records,
  force push, stripping needsSync, sanitizing local cover IDs, and
  applying push results (created/accepted/conflict/rejected).

  @spec-sync-protocol @FR1
  Scenario: Regular push collects only dirty records
    Given client has 5 tasks, 2 with needsSync true
    When push is called
    Then PushRequest contains only those 2 dirty tasks

  @spec-sync-protocol @FR1
  Scenario: Force push collects all records
    Given client has 5 tasks, 2 with needsSync true
    When push with force is called
    Then PushRequest contains all 5 tasks

  @spec-sync-protocol @FR1
  Scenario: needsSync is stripped from wire format
    Given client has a dirty task
    When push is called
    Then no record in PushRequest contains the needsSync field

  @spec-sync-protocol @FR1
  Scenario: Goals with local cover IDs are sanitized
    Given client has a dirty goal with cover_file_id "local:abc-123"
    When push is called
    Then PushRequest sends cover_file_id "" for that goal

  @spec-sync-protocol @FR1
  Scenario: Push skips when no dirty records exist
    Given client has no dirty records
    When push is called
    Then no PushRequest is sent to server

  @spec-sync-protocol @FR15
  Scenario: Created result clears dirty flag when unchanged during push
    Given client has a dirty task with id "t1"
    And server will respond with status "created" for "t1" and revision 7
    When push is called
    Then task "t1" has needsSync false and revision 7

  @spec-sync-protocol @FR15
  Scenario: Accepted result keeps dirty flag when changed during push
    Given client has a dirty task with id "t1"
    And local task will change during push
    And server will respond with status "accepted" for "t1" and revision 8
    When push is called
    Then task "t1" has needsSync true and revision 8

  @spec-sync-protocol @FR3 @FR15
  Scenario: Conflict result overwrites local record with server version
    Given client has a dirty task with id "t1"
    And server will respond with conflict and server_record for "t1"
    When push is called
    Then task "t1" is overwritten with server record
    And task "t1" has needsSync false

  @spec-sync-protocol @FR15
  Scenario: Rejected result keeps record unchanged
    Given client has a dirty task with id "t1"
    And server will respond with status "rejected" for "t1"
    When push is called
    Then task "t1" is not updated

  @spec-sync-protocol @FR15
  Scenario: Push updates last_known_revision from response
    Given client has a dirty task
    And server will respond with revision 20
    When push is called
    Then last_known_revision is set to 20

  @spec-sync-protocol @FR15
  Scenario: Push does not update revision when all results are conflicts
    Given client has a dirty task with id "t1"
    And server will respond with conflict and no top-level revision
    When push is called
    Then last_known_revision is not updated

  @spec-sync-protocol @FR1
  Scenario: Force push sends records even when nothing is dirty
    Given client has 3 tasks with needsSync false
    When push with force is called
    Then PushRequest contains all 3 tasks

  @spec-sync-protocol @FR1
  Scenario: Push with empty results array does not throw
    Given client has a dirty task with id "t1"
    And server will respond with empty results for tasks
    When push is called
    Then push completes without error

  @spec-sync-protocol @FR1
  Scenario: Push handles partial response with missing entity arrays
    Given client has a dirty task and a dirty goal
    And server will respond with results only for tasks
    When push is called
    Then push completes without error
