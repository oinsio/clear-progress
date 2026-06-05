Feature: Hidden task reveal respects day boundary
  Implements FR4, FR5, FR6 of day-boundary.

  @day-boundary @FR4
  Scenario: Task not revealed when appear date is after logical date
    Given a hidden task with appear date "2026-06-05"
    And day boundary is "02:00"
    And current local time is "01:30" on "2026-06-05"
    When system reveals hidden tasks using logical date
    Then the task remains hidden

  @day-boundary @FR4
  Scenario: Task revealed when appear date matches logical date
    Given a hidden task with appear date "2026-06-05"
    And day boundary is "02:00"
    And current local time is "14:00" on "2026-06-05"
    When system reveals hidden tasks using logical date
    Then the task is revealed

  @day-boundary @FR4
  Scenario: Task revealed when appear date is before logical date
    Given a hidden task with appear date "2026-06-04"
    And day boundary is "02:00"
    And current local time is "14:00" on "2026-06-05"
    When system reveals hidden tasks using logical date
    Then the task is revealed

  @day-boundary @FR4
  Scenario: Backward compatibility without explicit logical date
    Given a hidden task with appear date "2026-06-05"
    And current local time is "14:00" on "2026-06-05"
    When system reveals hidden tasks without logical date
    Then the task is revealed using calendar date from clock

  @day-boundary @FR5
  Scenario: Reveal timer scheduled for day boundary time
    Given day boundary is "02:00"
    And current local time is "23:00" on "2026-06-04"
    When system schedules the reveal timer
    Then the timer fires at "02:00" on "2026-06-05"

  @day-boundary @FR5
  Scenario: Reveal timer rescheduled on boundary change
    Given day boundary is "00:00"
    And current local time is "22:00" on "2026-06-04"
    And system has a scheduled reveal timer
    When day boundary changes to "02:00"
    Then the previous timer is cleared
    And a new timer is set for "02:00" on "2026-06-05"

  @day-boundary @FR6
  Scenario: Boundary shifted backward reveals tasks immediately
    Given a hidden task with appear date "2026-06-05"
    And day boundary is "02:00"
    And current local time is "01:00" on "2026-06-05"
    When day boundary changes to "00:00"
    Then logical date shifts from "2026-06-04" to "2026-06-05"
    And the task is revealed immediately

  @day-boundary @FR6
  Scenario: Boundary shifted forward does not un-reveal already revealed tasks
    Given a task that was already revealed on "2026-06-05"
    And day boundary is "00:00"
    And current local time is "01:00" on "2026-06-05"
    When day boundary changes to "02:00"
    Then logical date shifts from "2026-06-05" to "2026-06-04"
    And the task remains revealed
