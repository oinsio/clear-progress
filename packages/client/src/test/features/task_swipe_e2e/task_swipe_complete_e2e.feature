Feature: Task swipe complete (E2E)
  Implements FR17 of swipeable-item.
  Tests swipe-to-complete gesture on task items.

  Background:
    Given user has an active task in the inbox

  @swipeable-item @FR17
  Scenario: User completes task via right swipe
    Given user navigates to the inbox page
    When user swipes right on the task item
    Then the task is marked as completed
