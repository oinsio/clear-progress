Feature: Logical date computation from day boundary
  Implements FR3 of day-boundary.

  @day-boundary @FR3
  Scenario Outline: Logical date depends on current time relative to boundary
    Given day boundary is "<boundary>"
    And current local time is "<time>" on "<date>"
    When system computes the logical date
    Then logical date is "<logical_date>"

    Examples:
      | boundary | time  | date       | logical_date |
      | 00:00    | 14:00 | 2026-06-05 | 2026-06-05   |
      | 02:00    | 01:30 | 2026-06-05 | 2026-06-04   |
      | 02:00    | 02:00 | 2026-06-05 | 2026-06-05   |
      | 02:00    | 14:00 | 2026-06-05 | 2026-06-05   |
      | 06:00    | 05:59 | 2026-06-05 | 2026-06-04   |

  @day-boundary @FR3
  Scenario: Respects current timezone
    Given day boundary is "02:00"
    And timezone is "Asia/Tokyo"
    And current local time is "01:00" on "2026-06-05"
    When system computes the logical date
    Then logical date is "2026-06-04"
