## MODIFIED Requirements

### Requirement: System calculates next date for fixed daily frequency
# implements FR1, FR2, FR3 of align-daily-to-calendar-rhythm

System MUST calculate `next_date` for daily frequency by advancing from `previousNextDate` by `interval` days (calendar-aligned, Model B). Early completion MUST preserve the scheduled date. Skip logic MUST apply when the candidate is in the past — skip to the nearest future date aligned to the interval grid, strictly `> today`.

This aligns daily with weekly/monthly/yearly: all fixed frequencies use schedule-based computation. The `after_completion` type remains the only "from today" model.

#### Scenario: Daily interval 1 normal completion
- **WHEN** previous next_date is "2026-07-01" and today is "2026-07-01" and completed_at date is "2026-07-01"
- **THEN** system calculates next date with daily interval 1 as "2026-07-02"

#### Scenario: Daily interval 1 early completion preserves schedule
- **WHEN** previous next_date is "2026-07-02" and today is "2026-07-01" and completed_at date is "2026-07-01"
- **THEN** system calculates next date with daily interval 1 as "2026-07-02" (schedule preserved)

#### Scenario: Daily interval 1 late by 1 day skips to future
- **WHEN** previous next_date is "2026-07-01" and today is "2026-07-02" and completed_at date is "2026-07-02"
- **THEN** system calculates next date with daily interval 1 as "2026-07-03" (07-02 is today, skip to 07-03)

#### Scenario: Daily interval 1 long inactivity skips to tomorrow
- **WHEN** previous next_date is "2026-07-01" and today is "2026-07-15" and completed_at date is "2026-07-15"
- **THEN** system calculates next date with daily interval 1 as "2026-07-16"

#### Scenario: Daily interval 3 normal completion
- **WHEN** previous next_date is "2026-07-01" and today is "2026-07-01" and completed_at date is "2026-07-01"
- **THEN** system calculates next date with daily interval 3 as "2026-07-04"

#### Scenario: Daily interval 3 early completion preserves schedule
- **WHEN** previous next_date is "2026-07-04" and today is "2026-07-02" and completed_at date is "2026-07-02"
- **THEN** system calculates next date with daily interval 3 as "2026-07-04" (schedule preserved)

#### Scenario: Daily interval 3 late but candidate still in future
- **WHEN** previous next_date is "2026-07-01" and today is "2026-07-03" and completed_at date is "2026-07-03"
- **THEN** system calculates next date with daily interval 3 as "2026-07-04" (candidate > today)

#### Scenario: Daily interval 3 long inactivity skips by grid
- **WHEN** previous next_date is "2026-07-01" and today is "2026-07-15" and completed_at date is "2026-07-15"
- **THEN** system calculates next date with daily interval 3 as "2026-07-16" (grid: 01,04,07,10,13,16 — 16 > today)

#### Scenario: Daily interval 3 long inactivity candidate equals today
- **WHEN** previous next_date is "2026-07-01" and today is "2026-07-16" and completed_at date is "2026-07-16"
- **THEN** system calculates next date with daily interval 3 as "2026-07-19" (grid: 01,04,...,16 — 16 <= today, next is 19)

#### Scenario: Daily nearest-match on rule creation with interval 1
- **WHEN** user creates a daily rule with interval 1 and today is "2026-07-01"
- **THEN** system calculates next date as "2026-07-02" (today + interval)

#### Scenario: Daily nearest-match on rule creation with interval 3
- **WHEN** user creates a daily rule with interval 3 and today is "2026-07-01"
- **THEN** system calculates next date as "2026-07-04" (today + interval)

#### Scenario: Daily nearest-match on rule change resets rhythm
- **WHEN** user changes daily interval from 1 to 2 and today is "2026-07-03"
- **THEN** system calculates next date as "2026-07-05" (today + new interval, clean restart)
