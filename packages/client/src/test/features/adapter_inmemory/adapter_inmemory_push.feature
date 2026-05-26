Feature: In-memory adapter push
  Implements FR2, FR4, FR5 of adapter-inmemory-spec.

  @adapter-inmemory-spec @FR2
  Scenario: New entity gets created status
    Given an initialized adapter
    When a task with a valid UUID is pushed
    Then the push result has status "created" and revision greater than 0

  @adapter-inmemory-spec @FR2
  Scenario: Revision increments per push batch
    Given an initialized adapter
    When two separate push calls are made with different tasks
    Then the second push has a higher revision than the first

  @adapter-inmemory-spec @FR2
  Scenario: Update with newer timestamp is accepted
    Given an initialized adapter
    And a task exists with updated_at "2026-01-01T10:00:00.000Z"
    When the task is updated with updated_at "2026-01-01T12:00:00.000Z"
    Then the push result has status "accepted"

  @adapter-inmemory-spec @FR2
  Scenario: Update with equal timestamp is accepted
    Given an initialized adapter
    And a task exists with updated_at "2026-01-01T10:00:00.000Z"
    When the task is updated with updated_at "2026-01-01T10:00:00.000Z"
    Then the push result has status "accepted"

  @adapter-inmemory-spec @FR4
  Scenario: Invalid UUID is rejected
    Given an initialized adapter
    When a task with id "not-a-uuid" is pushed
    Then the push result has status "rejected" with reason "Invalid UUID format"

  @adapter-inmemory-spec @FR4
  Scenario: Blank name is rejected
    Given an initialized adapter
    When a task with blank name is pushed
    Then the push result has status "rejected" with reason "Name must not be blank"

  @adapter-inmemory-spec @FR4
  Scenario: Invalid box is rejected
    Given an initialized adapter
    When a task with box "invalid" is pushed
    Then the push result has status "rejected" with reason containing "invalid"

  @adapter-inmemory-spec @FR5
  Scenario: Stale update returns conflict with server record
    Given an initialized adapter
    And a task exists with updated_at "2026-01-02T00:00:00.000Z"
    When the task is updated with updated_at "2026-01-01T12:00:00.000Z"
    Then the push result has status "conflict" with server_record
