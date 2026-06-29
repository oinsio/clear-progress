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

#### Daily (every day) — Model A

```
Rule: { type: "fixed", frequency: "daily", interval: 1 }
Completed: 2026-04-10
Today: 2026-04-16

Calculation:
- today = 2026-04-16
- next = today + 1 = 2026-04-17

Result: 2026-04-17
```

#### Daily (every 3 days) — Model A

```
Rule: { type: "fixed", frequency: "daily", interval: 3 }
Completed: 2026-04-10
Today: 2026-04-20

Calculation:
- today = 2026-04-20
- next = today + 3 = 2026-04-23

Result: 2026-04-23
```

#### Weekly (every Monday and Wednesday) — Model B

```
Rule: { type: "fixed", frequency: "weekly", interval: 1, weekdays: [1, 3] }
Completed: 2026-04-08 (Wednesday)
Today: 2026-04-20 (Monday)

Calculation:
- prev = 2026-04-08
- Next weekday after prev: 2026-04-13 (Monday) -> skip
- Next: 2026-04-15 (Wednesday) -> skip
- Next: 2026-04-20 (Monday) -> today, skip
- Next: 2026-04-22 (Wednesday)

Skipped: April 13, 15, 20
```

#### Monthly (every 15th) — Model B

```
Rule: { type: "fixed", frequency: "monthly", interval: 1, day_of_month: 15 }
Completed: 2026-02-15
Today: 2026-04-20

Calculation:
- prev = 2026-02-15
- Target month: 2026-03 (in the past)
- Skip periods: ceil(2 / 1) = 2
- New target month: 2026-04
- 2026-04-15 < today -> add another interval
- Result: 2026-05-15
```

#### After Completion (N days after completion) — Model A

```
Rule: { type: "after_completion", delay_days: 7 }
Completed: 2026-04-10
Today: 2026-04-20

Calculation:
- completedDate = 2026-04-10
- next = 2026-04-10 + 7 days = 2026-04-17
- Skip logic NOT applied (date calculated from completedAt, not prev)
- Copy created with next_date = 2026-04-17 (in the past)
- Task will appear immediately when revealed
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
