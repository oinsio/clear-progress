Feature: Upcoming dates preview — Responsive Layout (E2E)
  Implements NFR-R1 of show-upcoming-recurrences.
  Tests that the date preview renders correctly on narrow screens.

  @show-upcoming-recurrences @NFR-R1
  Scenario: Date preview fits within viewport on 320px screen
    Given viewport is 320px wide
    And user opens the repeat rule selector for a task
    And user configures a daily fixed rule
    Then the upcoming dates preview is visible
    And the upcoming dates preview fits within the viewport
