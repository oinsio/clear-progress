Feature: DeletedPage swipe restore (E2E)
  Implements FR18 of swipeable-item.
  Tests swipe-to-restore gesture on DeletedPage in a real browser.

  Background:
    Given user has a deleted task in the database

  @swipeable-item @FR18
  Scenario: User restores deleted task via right swipe
    Given user navigates to the deleted page
    When user swipes right on the deleted task item
    Then the task disappears from the deleted list

  @swipeable-item @FR18 @NFR-A1
  Scenario: Restore button remains as accessible alternative
    Given user navigates to the deleted page
    Then each deleted item has a restore button with accessible label
