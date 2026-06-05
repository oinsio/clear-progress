Feature: Manual task hiding
  Implements FR1, FR2, FR5 of hide-tasks.

  @hide-tasks @FR1
  Scenario: Hide a non-recurring task with a future date
    Given a visible non-recurring task "Renew passport"
    When user hides the task until "2027-06-01"
    Then task has is_hidden true
    And task has appear_date "2027-06-01"
    And task has needsSync true

  @hide-tasks @FR2
  Scenario: Unhide a manually hidden task
    Given a hidden task "Renew passport" with appear_date "2027-06-01"
    When user unhides the task
    Then task has is_hidden false
    And task has appear_date ""
    And task has needsSync true

  @hide-tasks @FR5
  Scenario: Recurring task cannot be manually hidden
    Given a recurring task "Water plants"
    Then the task has repeat_rule set
    And the hide action should not be offered for recurring tasks
