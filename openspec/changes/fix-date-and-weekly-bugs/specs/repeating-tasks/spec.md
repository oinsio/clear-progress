## MODIFIED Requirements

### Requirement: Weekly recurrence with multiple weekdays respects interval as week-level skip
# implements FR5 of repeating-tasks-specs

System MUST treat `interval` in weekly recurrence as the number of weeks between active periods, not as a gap between individual weekday occurrences. When `weekdays` contains multiple days, all matching days within the same ISO week SHALL fire before advancing to the next active week.

The algorithm for `calculateNextDateWeekly` SHALL be:
1. Compute `nextDay = previousNextDate + 1 day`
2. Find all weekdays in the same ISO week as `nextDay` that are >= `nextDay`
3. If any matching weekday exists in the current week, return the earliest one (no interval skip)
4. If no matching weekday remains in the current week, advance to Monday of the next week, then skip `(interval - 1) * 7` days, and return the first matching weekday

#### Scenario: Biweekly Mon+Wed fires both days in active week
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], previousNextDate="2026-06-01" (Monday)
- **THEN** next date is "2026-06-03" (Wednesday of the same week)

#### Scenario: Biweekly Mon+Wed skips to next active week after Wednesday
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], previousNextDate="2026-06-03" (Wednesday)
- **THEN** next date is "2026-06-15" (Monday, two weeks later)

#### Scenario: Chain of 6 completions for biweekly Mon+Wed
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], starting from previousNextDate="2026-06-01"
- **THEN** the chain of next dates is: "2026-06-03", "2026-06-15", "2026-06-17", "2026-06-29", "2026-07-01", "2026-07-13"

#### Scenario: Single weekday with interval > 1 unchanged
- **WHEN** rule is weekly, interval=2, weekdays=[1], previousNextDate="2026-06-01" (Monday)
- **THEN** next date is "2026-06-15" (Monday, two weeks later)

### Requirement: Skip logic for weekly recurrence with multiple weekdays
# implements FR6 of repeating-tasks-specs

When skip logic is applied (previousNextDate is far in the past), the system MUST align to the correct active week and then apply the same two-step weekday selection (current week first, then advance). The period for skip calculation remains `7 * interval` days.

#### Scenario: Skip aligns to active week for multi-weekday
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], previousNextDate="2026-04-06" (Monday), today is "2026-06-10" (Wednesday)
- **THEN** next date is a Monday or Wednesday >= today, aligned to the correct biweekly cadence

### Requirement: Test comments match actual day-of-week
# implements FR4 of fix-date-and-weekly-bugs

All date comments in skip-logic tests MUST accurately reflect the ISO day of week for the given date. Test expectations MUST be derived from independent date calculation, not from running the function under test.

#### Scenario: Comment accuracy verification
- **WHEN** test comment says "2026-05-10" is "Saturday"
- **THEN** the comment is incorrect (2026-05-10 is Sunday) and MUST be fixed

#### Scenario: Comment accuracy for 2026-04-18
- **WHEN** test comment says "2026-04-18" is "Friday"
- **THEN** the comment is incorrect (2026-04-18 is Saturday) and MUST be fixed

#### Scenario: Comment accuracy for 2026-04-07
- **WHEN** test comment says "2026-04-07" is "Monday"
- **THEN** the comment is incorrect (2026-04-07 is Tuesday) and MUST be fixed
