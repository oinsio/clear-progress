Feature: Goal Focus
  Implements change add-goal-focus.
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

  @add-goal-focus @FR4 @FR5 @FR7
  Scenario: Display focused goals in navigation
    Given 0 goals in focus
    When user opens the app
    Then "focused_goals" block is not displayed in navigation

    When user adds goal "Write a book" to focus
    Then navigation displays 1 item: "Write a book"

    When user adds goal "Learn Spanish" to focus
    Then navigation displays 2 items: "Write a book", "Learn Spanish"

  @add-goal-focus @FR5 @UX2
  Scenario: Click on goal in navigation leads to goal page
    Given 1 goal in focus: "Write a book"
    When user clicks "Write a book" in navigation
    Then page "/goals/11111111-1111-1111-1111-111111111111" opens

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

  @add-goal-focus @FR11
  Scenario: Self-healing — invalid UUID in focused_goal_1
    Given Settings has focused_goal_1 = "corrupted"
    And Settings has focused_goal_2 = "22222222-2222-2222-2222-222222222222"
    When user opens the app
    Then system automatically corrects data
    And Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"
    And Settings has focused_goal_2 = ""
    And corrected data is sent for sync

  @add-goal-focus @FR11
  Scenario: Self-healing — goal not found on client
    Given Settings has focused_goal_1 = "99999999-9999-9999-9999-999999999999"
    And goal with that ID does not exist in IndexedDB
    And Settings has focused_goal_2 = "22222222-2222-2222-2222-222222222222"
    When user opens the app
    Then system automatically corrects data
    And Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"
    And Settings has focused_goal_2 = ""
    And corrected data is sent for sync

  @add-goal-focus @FR11
  Scenario: Self-healing — both slots corrupted
    Given Settings has focused_goal_1 = "corrupted1"
    And Settings has focused_goal_2 = "corrupted2"
    When user opens the app
    Then system automatically corrects data
    And Settings has focused_goal_1 = ""
    And Settings has focused_goal_2 = ""
    And corrected data is sent for sync

  @add-goal-focus @FR11
  Scenario: Self-healing — only second slot corrupted
    Given Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"
    And Settings has focused_goal_2 = "corrupted"
    When user opens the app
    Then system automatically corrects data
    And Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"
    And Settings has focused_goal_2 = ""
    And corrected data is sent for sync

  @add-goal-focus @FR8
  Scenario: Sync focus between devices
    Given user is connected to backend on device A
    And 0 goals in focus
    When user adds goal "Write a book" to focus
    And sync occurs
    And user opens the app on device B with same backend connection
    Then on device B 1 goal in focus: "Write a book"
    And navigation on device B displays "Write a book"

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

  @add-goal-focus @NFR-A1 @NFR-A2
  Scenario: Focus icon keyboard accessibility
    Given user opens goal page "Write a book"
    When user presses Tab to focus icon
    Then icon receives keyboard focus
    And icon aria-label = "Add to focus"
    When user presses Enter
    Then goal is added to focus
    And icon aria-label changed to "Remove from focus"

  @add-goal-focus @NFR-A3
  Scenario: Replacement dialog keyboard accessibility
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    And user opens goal page "Run a marathon"
    And clicks focus icon
    And replacement dialog is displayed
    When user presses Tab
    Then focus moves between dialog buttons
    When user presses Escape
    Then dialog closes
    And focus returns to focus icon

  @add-goal-focus @NFR-P1
  Scenario: Optimistic UI when adding to focus
    Given 0 goals in focus
    When user clicks focus icon
    Then icon instantly becomes active (< 100ms)
    And goal appears in navigation without waiting for IndexedDB write

  @add-goal-focus @NFR-R1
  Scenario: Display focused goals on different screen sizes
    Given 2 goals in focus: "Write a book", "Learn Spanish"
    When user opens the app on mobile (collapsed panel)
    Then focused goals are displayed in collapsed mode
    When user opens the app on desktop (expanded panel)
    Then focused goals are displayed in expanded mode with full names

  @add-goal-focus @UX4
  Scenario: Smooth goal disappearance from navigation
    Given 1 goal in focus: "Write a book"
    When user removes goal from focus
    Then goal smoothly disappears from navigation
    And no layout jank occurs
