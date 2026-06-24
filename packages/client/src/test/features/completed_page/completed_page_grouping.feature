Feature: CompletedPage date grouping
  Implements FR1, FR2 of miss-behavior-specs.

  @miss-behavior-specs @FR1
  Scenario: Task completed today appears in today group
    Given the current time is "2026-06-24T12:00:00Z"
    And a task completed at "2026-06-24T10:00:00Z"
    When tasks are grouped by completion date
    Then the task appears in the today group

  @miss-behavior-specs @FR1
  Scenario: Task completed yesterday appears in yesterday group
    Given the current time is "2026-06-24T12:00:00Z"
    And a task completed at "2026-06-23T10:00:00Z"
    When tasks are grouped by completion date
    Then the task appears in the yesterday group

  @miss-behavior-specs @FR1
  Scenario: Task completed 3 days ago appears in week group
    Given the current time is "2026-06-24T12:00:00Z"
    And a task completed at "2026-06-21T10:00:00Z"
    When tasks are grouped by completion date
    Then the task appears in the week group

  @miss-behavior-specs @FR1
  Scenario: Task completed 15 days ago appears in month group
    Given the current time is "2026-06-24T12:00:00Z"
    And a task completed at "2026-06-09T10:00:00Z"
    When tasks are grouped by completion date
    Then the task appears in the month group

  @miss-behavior-specs @FR1
  Scenario: Task completed 60 days ago appears in earlier group
    Given the current time is "2026-06-24T12:00:00Z"
    And a task completed at "2026-04-25T10:00:00Z"
    When tasks are grouped by completion date
    Then the task appears in the earlier group

  @miss-behavior-specs @FR1
  Scenario: Empty sections are not present in output
    Given the current time is "2026-06-24T12:00:00Z"
    And a task completed at "2026-06-24T10:00:00Z"
    When tasks are grouped by completion date
    Then the yesterday group is empty
    And the week group is empty
    And the month group is empty
    And the earlier group is empty

  @miss-behavior-specs @FR2
  Scenario: No completed tasks results in all empty groups
    Given the current time is "2026-06-24T12:00:00Z"
    And no completed tasks
    When tasks are grouped by completion date
    Then the today group is empty
    And the yesterday group is empty
    And the week group is empty
    And the month group is empty
    And the earlier group is empty
