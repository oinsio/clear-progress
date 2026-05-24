Feature: Recurring Copy Creation
  Implements FR9 of repeating-tasks-specs.

  @repeating-tasks-specs @FR9
  Scenario: Complete repeating task creates a copy
    Given active task "Morning routine" with a daily repeat_rule
    When user completes the task
    Then a new task is created with same name and repeat_rule
    And new task has a different ID and is_completed false
    And new task has calculated next_date and appear_date

  @repeating-tasks-specs @FR9
  Scenario: Recurring copy preserves original_task_id chain
    Given active task A with a daily repeat_rule and empty original_task_id
    When user completes task A producing copy B
    And user completes copy B producing copy C
    Then copy B has original_task_id equal to task A id
    And copy C has original_task_id equal to task A id

  @repeating-tasks-specs @FR9
  Scenario: Recurring copy includes checklist items
    Given active task with 3 checklist items where 2 are completed
    When user completes the task
    Then the recurring copy has 3 checklist items with new IDs
    And all copied checklist items have is_completed false
