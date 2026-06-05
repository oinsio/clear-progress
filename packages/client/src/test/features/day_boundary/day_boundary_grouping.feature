Feature: Completed tasks grouping and date formatting respect day boundary
  Implements FR8, FR9 of day-boundary.

  @day-boundary @FR8
  Scenario: Task completed before boundary grouped as previous logical day
    Given day boundary is "02:00"
    And a task was completed at "01:30" on "2026-06-05"
    When system groups completed tasks
    Then the task is grouped under "2026-06-04"

  @day-boundary @FR8
  Scenario: Task completed after boundary grouped as current logical day
    Given day boundary is "02:00"
    And a task was completed at "14:00" on "2026-06-05"
    When system groups completed tasks
    Then the task is grouped under "2026-06-05"

  @day-boundary @FR8
  Scenario: Default boundary preserves midnight-based grouping
    Given day boundary is "00:00"
    And a task was completed at "01:30" on "2026-06-05"
    When system groups completed tasks
    Then the task is grouped under "2026-06-05"

  @day-boundary @FR9
  Scenario: Today label shown for task completed before boundary
    Given day boundary is "02:00"
    And current local time is "01:30" on "2026-06-05"
    And a task was completed at "23:00" on "2026-06-04"
    When system formats the completion date
    Then the label is "Today"

  @day-boundary @FR9
  Scenario: Default boundary preserves date labels
    Given day boundary is "00:00"
    And current local time is "14:00" on "2026-06-05"
    And a task was completed at "10:00" on "2026-06-05"
    When system formats the completion date
    Then the label is "Today"
