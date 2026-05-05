Feature: Goal Focus — Non-Functional Requirements (Unit Tests)
  Performance and optimistic UI behavior.
  Tests that can be verified through TypeScript unit tests.

  Background:
    Given goals exist:
      | id                                   | name              | status      |
      | 11111111-1111-1111-1111-111111111111 | Write a book      | in_progress |
      | 22222222-2222-2222-2222-222222222222 | Learn Spanish     | in_progress |
      | 33333333-3333-3333-3333-333333333333 | Run a marathon    | in_progress |
      | 44444444-4444-4444-4444-444444444444 | Launch a startup  | planning    |

  @add-goal-focus @NFR-P1
  Scenario: Optimistic UI when adding to focus
    Given 0 goals in focus
    When user clicks focus icon
    Then icon instantly becomes active (< 100ms)
    And goal appears in navigation without waiting for IndexedDB write
