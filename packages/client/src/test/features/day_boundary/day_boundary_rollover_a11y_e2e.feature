Feature: Day boundary rollover — Accessibility (E2E)
  Implements NFR-A1 of fix-completed-today-stale-on-day-rollover.
  Tests that require a real browser for axe-core checks on the affected pages.

  @fix-completed-today-stale-on-day-rollover @NFR-A1
  Scenario: Active tasks page with a completed-today task passes axe-core checks
    Given user is on the active tasks page with a task completed today
    Then the active tasks page passes axe-core accessibility checks

  @fix-completed-today-stale-on-day-rollover @NFR-A1
  Scenario: Completed page with grouped tasks passes axe-core checks
    Given user is on the completed page with a task completed today
    Then the completed page passes axe-core accessibility checks

  # NFR-A1 verifies "the rollover update SHALL cause no accessibility
  # regressions" — so axe must scan the post-rollover DOM, not only the
  # pre-rollover DOM. These scenarios cross the day boundary in-place first.
  @fix-completed-today-stale-on-day-rollover @NFR-A1
  Scenario: Active tasks page still passes axe-core after the day boundary passes
    Given user is on the active tasks page with a task completed today
    When the day boundary passes without navigation
    Then the task is no longer shown in "completed today"
    And the active tasks page passes axe-core accessibility checks

  @fix-completed-today-stale-on-day-rollover @NFR-A1
  Scenario: Completed page still passes axe-core after the day boundary passes
    Given user is on the completed page with a task completed today
    When the day boundary passes without navigation
    Then the task is regrouped from today into yesterday
    And the completed page passes axe-core accessibility checks
