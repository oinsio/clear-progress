Feature: FocusMode dimming
  Implements FR4, FR5, FR6 of miss-behavior-specs.

  @miss-behavior-specs @FR6
  Scenario: No dimming when focus mode is off
    Given focus mode is disabled
    And task "A" is selected
    When dimming is evaluated for tasks "A", "B", "C"
    Then no tasks are dimmed

  @miss-behavior-specs @FR4
  Scenario: No dimming when no task is selected or expanded
    Given focus mode is enabled
    And no task is selected or expanded
    When dimming is evaluated for tasks "A", "B", "C"
    Then no tasks are dimmed

  @miss-behavior-specs @FR4 @FR5
  Scenario: Non-selected tasks are dimmed when a task is selected
    Given focus mode is enabled
    And task "A" is selected
    When dimming is evaluated for tasks "A", "B", "C"
    Then task "A" is not dimmed
    And task "B" is dimmed
    And task "C" is dimmed

  @miss-behavior-specs @FR4 @FR5
  Scenario: Expanded task is not dimmed
    Given focus mode is enabled
    And task "B" is expanded
    When dimming is evaluated for tasks "A", "B", "C"
    Then task "A" is dimmed
    And task "B" is not dimmed
    And task "C" is dimmed

  @miss-behavior-specs @FR5
  Scenario: Both selected and expanded tasks are not dimmed
    Given focus mode is enabled
    And task "A" is selected
    And task "B" is expanded
    When dimming is evaluated for tasks "A", "B", "C"
    Then task "A" is not dimmed
    And task "B" is not dimmed
    And task "C" is dimmed

  @miss-behavior-specs @FR6
  Scenario: Disabling focus mode removes all dimming
    Given focus mode is disabled
    And task "A" is selected
    And task "B" is expanded
    When dimming is evaluated for tasks "A", "B", "C"
    Then no tasks are dimmed
