Feature: Goal Focus — Auto-removal on Status Change
  Automatically remove goals from focus when they are deleted, completed, or cancelled.
  Goals remain in focus during editing until changes are saved.

  Background:
    Given goals exist:
      | id                                   | name              | status      |
      | 11111111-1111-1111-1111-111111111111 | Write a book      | in_progress |
      | 22222222-2222-2222-2222-222222222222 | Learn Spanish     | in_progress |
      | 33333333-3333-3333-3333-333333333333 | Run a marathon    | in_progress |
      | 44444444-4444-4444-4444-444444444444 | Launch a startup  | planning    |

  @add-goal-focus @FR9
  Scenario: Auto-remove goal from focus on soft delete
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    When user deletes goal "Write a book" (soft delete)
    Then goal "Write a book" is automatically removed from focus
    And goal "Learn Spanish" is shifted to focused_goal_1
    And Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"
    And Settings has focused_goal_2 = ""
    And navigation displays 1 item: "Learn Spanish"

  @add-goal-focus @FR9
  Scenario: Auto-remove goal from focus on completion
    Given 1 goal in focus: "Write a book"
    When user completes goal "Write a book" (status = completed)
    Then goal "Write a book" is automatically removed from focus
    And Settings has focused_goal_1 = ""
    And Settings has focused_goal_2 = ""
    And "focused_goals" block is not displayed in navigation

  @add-goal-focus @FR9
  Scenario: Auto-remove goal from focus on cancellation
    Given 1 goal in focus: "Launch a startup"
    When user cancels goal "Launch a startup" (status = cancelled)
    Then goal "Launch a startup" is automatically removed from focus
    And Settings has focused_goal_1 = ""
    And Settings has focused_goal_2 = ""

  @add-goal-focus @FR9 @fix-goal-status-edit-mode @FR1
  Scenario: Goal remains in focus during editing when status changed to completed (not saved)
    Given 1 goal in focus: "Write a book"
    And goal "Write a book" has status "in_progress"
    When user opens goal page "Write a book"
    And user starts editing goal
    And user changes status to "completed" in edit mode
    But user does NOT save changes (still in edit mode)
    Then goal "Write a book" remains in focus
    And focus icon is active
    And navigation displays "Write a book"
    And Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"

  @add-goal-focus @FR9 @fix-goal-status-edit-mode @FR3
  Scenario: Goal remains in focus when status change is cancelled
    Given 1 goal in focus: "Launch a startup"
    And goal "Launch a startup" has status "planning"
    When user opens goal page "Launch a startup"
    And user starts editing goal
    And user changes status to "cancelled" in edit mode
    And user cancels editing
    Then goal "Launch a startup" remains in focus
    And goal "Launch a startup" remains to have status "planning"
    And focus icon is active
    And navigation displays "Launch a startup"
    And Settings has focused_goal_1 = "44444444-4444-4444-4444-444444444444"

  @add-goal-focus @FR9 @fix-goal-status-edit-mode @FR2
  Scenario: Goal removed from focus after saving status change to completed
    Given 1 goal in focus: "Write a book"
    And goal "Write a book" has status "in_progress"
    When user opens goal page "Write a book"
    And user starts editing goal
    And user changes status to "completed" in edit mode
    And user saves changes
    Then goal "Write a book" is automatically removed from focus
    And Settings has focused_goal_1 = ""
    And Settings has focused_goal_2 = ""
    And "focused_goals" block is not displayed in navigation
