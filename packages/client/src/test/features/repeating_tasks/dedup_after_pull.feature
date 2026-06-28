Feature: Dedup After Pull
  Implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull.

  @dedup-recurring-after-pull @FR1 @FR2
  Scenario: Two duplicates with different next_date — earlier wins
    Given two recurring copies with the same original_task_id
    And copy A has next_date "2026-07-01"
    And copy B has next_date "2026-07-05"
    When deduplication runs
    Then copy A is kept
    And copy B is soft-deleted with syncStatus "pending"

  @dedup-recurring-after-pull @FR1 @FR2
  Scenario: Two duplicates with same next_date — tiebreak by id
    Given two recurring copies with the same original_task_id
    And copy A has next_date "2026-07-01" and lexicographically smaller id
    And copy B has next_date "2026-07-01" and lexicographically larger id
    When deduplication runs
    Then copy A is kept
    And copy B is soft-deleted with syncStatus "pending"

  @dedup-recurring-after-pull @FR1
  Scenario: No duplicates — single copy is untouched
    Given one recurring copy exists
    When deduplication runs
    Then the single copy is kept

  @dedup-recurring-after-pull @FR3
  Scenario: Checklist items of loser are cascade soft-deleted
    Given two recurring copies with the same original_task_id
    And copy A has next_date "2026-07-01"
    And copy B has next_date "2026-07-05"
    And copy B has a checklist item
    When deduplication runs
    Then the checklist item is soft-deleted with syncStatus "pending"

  @dedup-recurring-after-pull @FR5
  Scenario: Empty original_task_id list — deduplication is skipped
    Given two recurring copies with the same original_task_id
    When deduplication runs with empty list
    Then no tasks are modified
