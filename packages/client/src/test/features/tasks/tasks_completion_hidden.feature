Feature: Completing a manually hidden task clears hide state
  Implements FR6 of hide-tasks.

  @hide-tasks @FR6
  Scenario: Completing a manually hidden non-recurring task clears hide state
    Given a hidden non-recurring task "Renew passport" with appear_date "2027-06-01"
    When user completes the task
    Then task has is_completed true
    And task has is_hidden false
    And task has appear_date ""

  @hide-tasks @FR6
  Scenario: Completing a recurring hidden task does not clear hide state
    Given a hidden recurring task "Water plants" exists
    When user completes the task
    Then the completed task has is_completed true
    And the recurring copy manages its own hide state
