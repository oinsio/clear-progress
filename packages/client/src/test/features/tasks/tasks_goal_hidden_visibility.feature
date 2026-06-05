Feature: Hidden tasks visibility on goal detail page
  Implements FR9 of hide-tasks.

  @hide-tasks @FR9
  Scenario: Hidden tasks included when showHidden is true
    Given a goal with a hidden task and a visible task
    When tasks are fetched with includeHidden true
    Then both tasks are returned

  @hide-tasks @FR9
  Scenario: Hidden tasks excluded when showHidden is false
    Given a goal with a hidden task and a visible task
    When tasks are fetched with includeHidden false
    Then only the visible task is returned
