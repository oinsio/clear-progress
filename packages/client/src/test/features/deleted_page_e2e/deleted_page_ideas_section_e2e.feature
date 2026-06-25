Feature: DeletedPage ideas section (E2E)
  Implements FR21 of swipeable-item.
  Tests ideas section visibility on DeletedPage.

  Background:
    Given user has a deleted idea in the database

  @swipeable-item @FR21
  Scenario: Deleted ideas appear in the Ideas section
    Given user navigates to the deleted page
    Then the Ideas section is visible with the deleted idea
