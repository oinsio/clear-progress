Feature: Goal Focus — Non-Functional Requirements
  Accessibility, performance, responsive design, and UX polish.
  Ensures the feature works well across devices and for all users.

  Background:
    Given goals exist:
      | id                                   | name              | status      |
      | 11111111-1111-1111-1111-111111111111 | Write a book      | in_progress |
      | 22222222-2222-2222-2222-222222222222 | Learn Spanish     | in_progress |
      | 33333333-3333-3333-3333-333333333333 | Run a marathon    | in_progress |
      | 44444444-4444-4444-4444-444444444444 | Launch a startup  | planning    |

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
