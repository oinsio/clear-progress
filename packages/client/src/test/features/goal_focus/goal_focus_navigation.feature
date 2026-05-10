Feature: Goal Focus — Navigation Display
  Display focused goals in navigation and menu settings.
  User can see focused goals in navigation and configure their visibility.

  Background:
    Given goals exist:
      | id                                   | name              | status      |
      | 11111111-1111-1111-1111-111111111111 | Write a book      | in_progress |
      | 22222222-2222-2222-2222-222222222222 | Learn Spanish     | in_progress |
      | 33333333-3333-3333-3333-333333333333 | Run a marathon    | in_progress |
      | 44444444-4444-4444-4444-444444444444 | Launch a startup  | planning    |

  @add-goal-focus @FR4 @FR5 @FR7
  Scenario: Display focused goals in navigation
    Given 0 goals in focus
    When user opens the app
    Then "focused_goals" block is not displayed in navigation

    When user adds goal "Write a book" to focus
    Then navigation displays 1 item: "Write a book"

    When user adds second goal "Learn Spanish" to focus
    Then navigation displays 2 items: "Write a book", "Learn Spanish"

  @add-goal-focus @FR5 @UX2
  Scenario: Click on goal in navigation leads to goal page
    Given 1 goal in focus: "Write a book"
    When user clicks "Write a book" in navigation
    Then page "/goals/11111111-1111-1111-1111-111111111111" opens

  @add-goal-focus @FR6
  Scenario: Focused goals as single block in menu settings
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    When user opens menu order settings
    Then "focused_goals" is displayed as one draggable element
    And both goals move together when order changes

  @add-goal-focus @FR6
  Scenario: Hide focused_goals block in menu settings
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    When user hides "focused_goals" block in menu settings
    Then both goals disappear from navigation
    And Settings data remains unchanged

  @fix-focused-goal-highlight @FR1 @FR6
  Scenario: Focused goal highlighted on its detail page
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    And "focused_goals" block is visible in menu
    When user navigates to goal page "Write a book"
    Then focused goal "Write a book" nav item is active
    And "Goals" menu item is not active
    And focused goal "Learn Spanish" nav item is not active

  @fix-focused-goal-highlight @FR5
  Scenario: Highlight updates reactively when focus is toggled off
    Given 1 goal in focus: "Write a book"
    And "focused_goals" block is visible in menu
    And user is on goal page "Write a book"
    And focused goal "Write a book" nav item is active
    When user removes goal "Write a book" from focus
    Then focused goal "Write a book" nav item is not rendered
    And "Goals" menu item is active

  @fix-focused-goal-highlight @FR5
  Scenario: Highlight updates reactively when focus is toggled on
    Given 0 goals in focus
    And user is on goal page "Write a book"
    And "Goals" menu item is active
    When user adds goal "Write a book" to focus
    Then focused goal "Write a book" nav item is active
    And "Goals" menu item is not active

  @fix-focused-goal-highlight @FR3
  Scenario: Fallback to Goals highlight when focused_goals block is hidden
    Given 1 goal in focus: "Write a book"
    And "focused_goals" block is hidden in menu
    When user navigates to goal page "Write a book"
    Then "Goals" menu item is active
    And focused goal "Write a book" nav item is not rendered

  @fix-focused-goal-highlight @FR2
  Scenario: Goals highlighted when goal is not in focus
    Given 0 goals in focus
    When user navigates to goal page "Write a book"
    Then "Goals" menu item is active
    And focused goal "Write a book" nav item is not rendered
