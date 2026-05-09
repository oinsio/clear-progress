Feature: Goal Focus — Replacement Dialog
  Replacement dialog appears when attempting to add a third goal.
  User can replace one of the existing focused goals or cancel.

  Background:
    Given goals exist:
      | id                                   | name              | status      |
      | 11111111-1111-1111-1111-111111111111 | Write a book      | in_progress |
      | 22222222-2222-2222-2222-222222222222 | Learn Spanish     | in_progress |
      | 33333333-3333-3333-3333-333333333333 | Run a marathon    | in_progress |
      | 44444444-4444-4444-4444-444444444444 | Launch a startup  | planning    |

  @add-goal-focus @FR2 @FR3 @UX3
  Scenario: Attempt to add third goal — show replacement dialog
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    When user opens goal page "Run a marathon"
    And clicks focus icon
    Then replacement dialog is displayed
    And dialog shows current focused goals: "Write a book", "Learn Spanish"
    And dialog offers actions: replace first, replace second, cancel

  @add-goal-focus @FR3
  Scenario: Replace first goal via dialog — shift up
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    And user opens goal page "Run a marathon"
    And clicks focus icon
    And replacement dialog is displayed
    When user selects "Replace Write a book"
    Then goal "Write a book" is removed from focus
    And goal "Run a marathon" is added to focus
    And Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"
    And Settings has focused_goal_2 = "33333333-3333-3333-3333-333333333333"

  @add-goal-focus @FR3
  Scenario: Replace second goal via dialog
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    And user opens goal page "Run a marathon"
    And clicks focus icon
    And replacement dialog is displayed
    When user selects "Replace Learn Spanish"
    Then goal "Learn Spanish" is removed from focus
    And goal "Run a marathon" is added to focus
    And Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"
    And Settings has focused_goal_2 = "33333333-3333-3333-3333-333333333333"

  @add-goal-focus @FR3
  Scenario: Cancel goal replacement
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    And user opens goal page "Run a marathon"
    And clicks focus icon
    And replacement dialog is displayed
    When user selects "Cancel"
    Then dialog closes
    And 2 goals remain in focus: "Write a book", "Learn Spanish"
    And Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"
    And Settings has focused_goal_2 = "22222222-2222-2222-2222-222222222222"