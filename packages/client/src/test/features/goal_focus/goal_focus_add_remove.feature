Feature: Goal Focus — Add and Remove Operations
  Basic operations for adding and removing goals from focus.
  User can select 1-2 goals for quick access from navigation.

  Background:
    Given goals exist:
      | id                                   | name              | status      |
      | 11111111-1111-1111-1111-111111111111 | Write a book      | in_progress |
      | 22222222-2222-2222-2222-222222222222 | Learn Spanish     | in_progress |
      | 33333333-3333-3333-3333-333333333333 | Run a marathon    | in_progress |
      | 44444444-4444-4444-4444-444444444444 | Launch a startup  | planning    |

  @add-goal-focus @FR1 @FR8
  Scenario: Add first goal to focus
    Given 0 goals in focus
    When user opens goal page "Write a book"
    And clicks focus icon
    Then goal "Write a book" is added to focus
    And focus icon is active
    And Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"
    And Settings has focused_goal_2 = ""

  @add-goal-focus @FR1 @FR8
  Scenario: Add second goal to focus
    Given 1 goal in focus: "Write a book"
    When user opens goal page "Learn Spanish"
    And clicks focus icon
    Then goal "Learn Spanish" is added to focus
    And focus icon is active
    And Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"
    And Settings has focused_goal_2 = "22222222-2222-2222-2222-222222222222"

  @add-goal-focus @FR10
  Scenario: Remove goal from focus via toggle
    Given 1 goal in focus: "Write a book"
    When user opens goal page "Write a book"
    And clicks focus icon
    Then goal "Write a book" is removed from focus
    And focus icon is inactive
    And Settings has focused_goal_1 = ""
    And Settings has focused_goal_2 = ""

  @add-goal-focus @FR1 @FR2
  Scenario: Remove first goal when second is occupied — shift up
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    When user opens goal page "Write a book"
    And clicks focus icon
    Then goal "Write a book" is removed from focus
    And goal "Learn Spanish" remains in focus
    And Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"
    And Settings has focused_goal_2 = ""
