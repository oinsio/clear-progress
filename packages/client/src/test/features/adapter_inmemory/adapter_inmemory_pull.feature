Feature: In-memory adapter pull
  Implements FR3 of adapter-inmemory-spec.

  @adapter-inmemory-spec @FR3
  Scenario: Pull returns empty arrays for fresh state
    Given an initialized adapter with no data
    When pull is called with since_revision 0
    Then all entity arrays are empty and current_revision is 0 and purge_revision is 0

  @adapter-inmemory-spec @FR3
  Scenario: Pull filters by since_revision
    Given an initialized adapter
    And a task was pushed in the first batch
    And another task was pushed in the second batch
    When pull is called with since_revision equal to the first batch revision
    Then only the task from the second batch is returned

  @adapter-inmemory-spec @FR3
  Scenario: current_revision reflects latest push
    Given an initialized adapter
    And two push batches have been made
    When pull is called with since_revision 0
    Then current_revision equals the revision from the last push
