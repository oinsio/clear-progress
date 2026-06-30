# ADR: Skip Logic for Recurring Tasks

**Status:** Accepted
**Date:** 2026-04-16
**Context:** Handling recurring tasks during prolonged user inactivity

---

## Problem

What should happen with recurring tasks when a user doesn't open the app for several days or weeks?

**Scenario:**
1. User creates task "Workout" with rule "every day"
2. Completes it on April 10, 2026
3. Doesn't open the app until April 16, 2026
4. Opens the app on April 16

**Question:** How many copies of the task should be created?

### Behavior Options

**Option A: Accumulate missed recurrences**
- Create 6 copies (April 11, 12, 13, 14, 15, 16)
- All copies appear simultaneously when the app opens
- User sees 6 identical tasks in the list

**Option B: Skip logic (current implementation)**
- Create 1 copy with `next_date = 2026-04-17` (nearest future day)
- Missed days (April 11-16) are ignored
- User sees only the next recurrence

---

## Decision

**Chosen Option B: Skip logic**

When completing a recurring task, `next_date` is calculated. If this date is in the past (due to prolonged inactivity), the system **skips** all intermediate recurrences and calculates the nearest future date.

### Two Computation Models

**Model A — "from today"** (daily, after_completion):
`next_date = today + interval`. The user did the task today, the next one is N days from now. The original schedule is irrelevant — previous `next_date` is not used.

**Model B — "by schedule"** (weekly, monthly, yearly):
`next_date = nearest scheduled date strictly after today`. The interval rhythm is preserved from the original schedule. The system iterates forward from the previous date until it finds a date > today.

### User Rationale

The two models reflect fundamentally different user mental models:

**Why daily uses "from today" (Model A):**
- "Watering flowers" every 3 days: *"I already watered them today. They don't need watering for 3 days. Next time I need this task is in 3 days."* The user thinks in terms of cooldown from last execution, not calendar rhythm.
- "Workout" every day: *"I worked out today, next one is tomorrow."* Even with early completion via advance_days, the user expects tomorrow — not the originally scheduled date.
- "Haircut" every 30 days (after_completion): *"Got a haircut today, next one in 30 days."* The interval counts from when the action was actually performed.

**Why weekly/monthly/yearly use "by schedule" (Model B):**
- "Weekly report" every Monday: *"I did the report on Sunday for the past period. But I plan to keep doing reports on Mondays. Next one is Monday."* The user has a fixed calendar anchor.
- "Biweekly retrospective" every other Monday: *"I did it a week late, but the biweekly rhythm from the original schedule matters."* The cadence is preserved from the start date.
- "Rent payment" on the 1st: *"I paid on July 1st — July is done, next is August 1st."* Calendar dates are the anchor, not time since last payment.
- "Mom's birthday" on March 15: *"I already congratulated her today, next year."* Annual events are fixed dates.

**Early completion (advance_days) highlights the difference:**
- Daily early completion: *"I started training earlier than planned, but my daily rhythm matters — did it today, next is tomorrow."* → `today + interval`
- Weekly early completion: *"I did the report early on Saturday, but the next report is still Monday. So, this is reminder for me."* → schedule preserved
- Monthly early completion: *"I paid rent early on the 12th, but July 15th hasn't arrived yet — I still need to pay, or remember about this."* → schedule preserved

### Implementation

Logic is in `packages/client/src/utils/repeatRule.ts`, function `calculateNextDateDaily()`:

```typescript
function calculateNextDateDaily(interval, previousNextDate, clock) {
  const today = clock.plainDateISO();
  return today.add({ days: interval }).toString();
}
```

**Algorithm (daily):**
1. Return `today + interval`

### Examples

#### Daily (every day), skip — Model A

```
Task: "Workout", every day
Rule: { type: "fixed", frequency: "daily", interval: 1 }
prev: 2026-04-10, Today: 2026-04-16

Rationale: "I worked out today. Next one is tomorrow."
Calculation: today + 1 = 2026-04-17
Result: 2026-04-17
```

#### Daily (every 3 days), skip — Model A

```
Task: "Water flowers", every 3 days
Rule: { type: "fixed", frequency: "daily", interval: 3 }
prev: 2026-04-10, Today: 2026-04-20

Rationale: "I already watered them. No watering needed for 3 days."
Calculation: today + 3 = 2026-04-23
Result: 2026-04-23 (NOT schedule-aligned 2026-04-22)
```

#### Daily, early completion via advance_days — Model A

```
Task: "Workout", every day, advance_days=3
Rule: { type: "fixed", frequency: "daily", interval: 1 }
prev (next_date): 2026-07-05, Today: 2026-07-03 (completed early)

Rationale: "I started training earlier, but daily rhythm matters."
Calculation: today + 1 = 2026-07-04
Result: 2026-07-04 (ignores original schedule)
```

#### Weekly (every Monday), skip — Model B

```
Task: "Weekly report", every Monday
Rule: { type: "fixed", frequency: "weekly", interval: 1, weekdays: [1] }
prev: 2026-04-20 (Mon), Today: 2026-05-10 (Sun)

Rationale: "Did the report on Sunday for last period.
            Plan to keep doing reports on Mondays."
Calculation: nearest Monday > today = 2026-05-11
Result: 2026-05-11
```

#### Weekly (every Monday and Wednesday), skip — Model B

```
Rule: { type: "fixed", frequency: "weekly", interval: 1, weekdays: [1, 3] }
prev: 2026-04-08 (Wed), Today: 2026-04-20 (Mon)

Calculation:
- Next weekday after prev: 2026-04-13 (Mon) -> skip
- Next: 2026-04-15 (Wed) -> skip
- Next: 2026-04-20 (Mon) -> today, skip (strictly after today)
- Next: 2026-04-22 (Wed) -> future

Skipped: April 13, 15, 20
Result: 2026-04-22
```

#### Weekly (biweekly Monday), skip — rhythm preserved — Model B

```
Task: "Retrospective", every other Monday
Rule: { type: "fixed", frequency: "weekly", interval: 2, weekdays: [1] }
prev: 2026-06-22 (Mon), Today: 2026-06-29 (Sun)

Rationale: "Did it a week late, but the biweekly rhythm matters."
Cadence from prev: Jun 22 → Jul 6 → Jul 20 → ...
Result: 2026-07-06 (rhythm preserved from original schedule)
```

#### Weekly, early completion via advance_days — Model B

```
Task: "Weekly report", every Monday, advance_days=3
Rule: { type: "fixed", frequency: "weekly", interval: 1, weekdays: [1] }
prev (next_date): 2026-07-06 (Mon), Today: 2026-07-04 (Sat)

Rationale: "Did the report early on Saturday,
            but the next report is still Monday."
Calculation: nearest Monday > today = 2026-07-06 (still in future)
Result: 2026-07-06 (schedule preserved)
```

#### Monthly (1st of month), today = scheduled date — Model B

```
Task: "Rent payment", 1st of every month
Rule: { type: "fixed", frequency: "monthly", interval: 1, day_of_month: 1 }
prev: 2026-01-01, Today: 2026-07-01

Rationale: "Paid on July 1st — July is done, next is August 1st."
Calculation: nearest 1st strictly > today = 2026-08-01
Result: 2026-08-01
```

#### Monthly (15th of month), date not yet arrived — Model B

```
Task: "Rent payment", 15th of every month
Rule: { type: "fixed", frequency: "monthly", interval: 1, day_of_month: 15 }
prev: 2026-01-15, Today: 2026-07-01

Rationale: "July 15th hasn't arrived yet — I still need to pay."
Calculation: nearest 15th strictly > today = 2026-07-15
Result: 2026-07-15
```

#### Monthly, early completion via advance_days — Model B

```
Task: "Rent payment", 15th of every month, advance_days=5
Rule: { type: "fixed", frequency: "monthly", interval: 1, day_of_month: 15 }
prev (next_date): 2026-07-15, Today: 2026-07-12 (completed early)

Rationale: "Paid early on the 12th, but July 15th hasn't arrived
            yet — I still need to pay."
Calculation: 2026-07-15 > today → return as-is
Result: 2026-07-15 (schedule preserved)
```

#### Monthly, day=31 clamping — Model B

```
Task: "End of month close", 31st of every month
Rule: { type: "fixed", frequency: "monthly", interval: 1, day_of_month: 31 }
prev: 2026-01-31, Today: 2026-01-31

Calculation:
- Target: 2026-02-31 → Feb has 28 days → clamp to 2026-02-28
Result: 2026-02-28

Next completion (prev: 2026-02-28, Today: 2026-02-28):
- Target: 2026-03-31 → Mar has 31 days → return to original day
Result: 2026-03-31 (original day_of_month=31 is remembered)
```

#### Yearly (March 15), today = scheduled date — Model B

```
Task: "Mom's birthday", every year March 15
Rule: { type: "fixed", frequency: "yearly", interval: 1, month_and_day: {3, 15} }
prev: 2024-03-15, Today: 2026-03-15

Rationale: "Already congratulated her today, next year."
Calculation: nearest Mar 15 strictly > today = 2027-03-15
Result: 2027-03-15
```

#### Yearly, early completion via advance_days — Model B

```
Task: "Christmas gift", every year Dec 25, advance_days=7
Rule: { type: "fixed", frequency: "yearly", interval: 1, month_and_day: {12, 25} }
prev (next_date): 2026-12-25, Today: 2026-12-20 (completed early)

Calculation: 2026-12-25 > today → return as-is
Result: 2026-12-25 (schedule preserved)
```

#### After Completion (N days after completion) — Model A

```
Task: "Haircut", 7 days after completion
Rule: { type: "after_completion", delay_days: 7 }
Completed: 2026-04-10, Today: 2026-04-20

Rationale: "Got a haircut today, next one in 7 days."
Calculation:
- completedDate = 2026-04-10
- next = 2026-04-10 + 7 days = 2026-04-17
- Skip logic NOT applied (date calculated from completedAt, not prev)
- Copy created with next_date = 2026-04-17 (in the past)
- Task will appear immediately when revealed

Result: 2026-04-17
```

---

## Rationale

### Why skip logic is correct for a GTD-supporting app

1. **Avoiding list overload** — A user returning from vacation shouldn't see 30 copies of "Workout"
2. **Focus on the future, not the past** — Missed workouts are no longer relevant; what matters is the next one
3. **Matching user expectations** — If the user didn't open the app, they weren't planning to complete tasks
4. **Performance** — No hundreds of records created in IndexedDB during long breaks

### Alternatives Considered

**Option A: Accumulate all missed recurrences** — Rejected due to UX problems (list overload)
**Option C: Notification about missed recurrences** — Excessive for MVP
**Option D: User-configurable behavior** — Premature optimization

---

## Limitations and Edge Cases

### 1. Monthly and Yearly have skip logic

Skip logic is implemented for `monthly` and `yearly` analogously to `daily`. See `calculateNextDateMonthly()` and `calculateNextDateYearly()` in `repeatRule.ts`.

### 2. After Completion has no skip logic

For `after_completion`, date is calculated from `completedAt`, not from `prev`. This is correct: "Check email in 7 days" should appear 7 days after completion, even if the user didn't open the app.

### 3. Weekly with multiple weekdays

`findNextWeekday()` iterates through days up to `7 * interval` and finds the first matching day >= `today`. This is equivalent to skip logic but less explicit.

### 4. Timezones

`today` is calculated via `Temporal.Now.plainDateISO()`, which uses the system timezone. See `docs/adr/0001-recurring-tasks-timezone-policy.md` for rationale.

### 5. Monthly clamping

When `day_of_month` exceeds days in the target month (e.g., 31 in February), the system clamps to the last day of that month. The original `day_of_month` is preserved in the repeat rule — clamping is applied at calculation time, not stored. This means after February (28th), March correctly returns to 31st.

---

## Related Documents

- `DATE_TIME_AUDIT_REPORT.md` — item 11 (original problem)
- `packages/client/src/utils/repeatRule.ts` — skip logic implementation
- `packages/client/src/services/TaskService.ts` — recurring copy creation
- `packages/client/src/services/HiddenTaskService.ts` — hidden task revealing

---

## Change History

- **2026-04-16**: Created ADR based on date/time handling audit
- **2026-06-29**: Updated daily examples to reflect Model A ("from today") computation; documented two computation models (FR4 of fix-recurring-skip-logic)
- **2026-06-30**: Added user rationale section with real-world examples; added examples for early completion (advance_days) for all frequencies; added weekly/monthly/yearly skip examples; added clamping example (FR1-FR3 of add-recurring-edge-case-tests)
