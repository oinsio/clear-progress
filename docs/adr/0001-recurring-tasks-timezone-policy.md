# ADR: Timezone Policy for Recurring Tasks

**Status:** Accepted
**Date:** 2026-04-16
**Context:** Handling timezones when calculating recurring task dates

---

## Problem

Should recurring tasks store the timezone in which they were created?

**Scenario from audit (item 5 in `DATE_TIME_AUDIT_REPORT.md`):**

1. User creates task "Morning exercise" with rule "daily" in Almaty (`Asia/Almaty`, UTC+5)
2. Completes the task on April 10, 2026 at 08:00 local time
3. Moves to New York (`America/New_York`, UTC-5)
4. Opens the app on April 16, 2026

**Question:** In which timezone should the next recurrence date be calculated?

### Behavior Options

**Option A: Store creation timezone**
- `RepeatRule` contains field `timeZone: "Asia/Almaty"`
- `next_date` calculation uses the stored timezone
- "Morning exercise" continues to appear at 08:00 Almaty time (which is 18:00 the previous day in New York)

**Option B: Use current timezone (current implementation)**
- `RepeatRule` does NOT contain a `timeZone` field
- `next_date` calculation uses `Temporal.Now.timeZoneId()` (current system timezone)
- "Morning exercise" appears in the morning New York time

---

## Decision

**Chosen Option B: Use current system timezone**

Recurring tasks **do not store** the creation timezone. All `next_date` and `appear_date` calculations use the current system timezone (`Temporal.Now.timeZoneId()`).

### Implementation

**Data model:**
```typescript
// packages/client/src/types/common.ts
export interface RepeatRule {
  type: "fixed" | "after_completion";
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  // timeZone is intentionally NOT stored
}
```

**Date calculation:**
```typescript
// packages/client/src/utils/repeatRule.ts
export function calculateNextDate(
  rule: RepeatRule,
  previousNextDate: string,
  completedAt?: string,
  clock: Clock = systemClock,
): string {
  const timeZone = clock.timeZoneId(); // Current timezone
  // ...
}
```

**Key points:**
- `clock.timeZoneId()` always returns the current system timezone
- When the device timezone changes, all subsequent calculations use the new timezone
- The `timeZone` field in `RepeatRule` is intentionally absent

---

## Rationale

### Why this is correct for a GTD-supporting app

#### 1. Tasks vs Calendar Events

**Task** — an action tied to context and day, not to an absolute moment in time:
- "Morning exercise" — something to do in the morning of the current day
- "Weekly review" — something to do on Sunday, regardless of timezone
- "Pay bills" — something to do before end of month

**Calendar event** — a meeting at a specific UTC moment:
- "Call with colleague at 10:00 UTC+5" should remain at 10:00 UTC+5, even if the user is in UTC-5

**Clear Progress is a GTD productivity helper, not a calendar.** Tasks are tied to days and contexts, not absolute time.

#### 2. Natural behavior for users

When a user relocates or travels, their daily routine adapts to the new timezone:
- Morning arrives in local time
- Workday starts in local time

Recurring tasks should follow this natural rhythm.

#### 3. Avoiding confusion

If "Morning exercise" appears in the evening (because it's tied to the creation timezone), it creates cognitive dissonance.

#### 4. Data model simplicity

No `timeZone` field in `RepeatRule`:
- Simplifies data model
- Reduces record size in IndexedDB and Google Sheets
- Eliminates edge cases with invalid IANA identifiers

---

## Example Scenarios

### Scenario 1: Travel (short-term)

- User lives in Moscow (`Europe/Moscow`, UTC+3), created daily "Morning exercise"
- Flies to Tokyo (`Asia/Tokyo`, UTC+9) for a week
- **Behavior:** Task appears in the morning by local time in both cities
- **Result:** Task always appears in the morning by local time — matches user expectations

### Scenario 2: Relocation (long-term)

- User lived in Almaty, created "Weekly review" (every Sunday)
- Moved to New York
- **Behavior:** Task appears on Sunday by New York time
- **Result:** Task stays on Sunday, adapts to new timezone

### Scenario 3: Contrast with calendar

- Calendar event: "Call with NYC client at 10:00 NYC" — must stay at 10:00 UTC-5
- Task: "Prepare for the call" — appears on the call day by local time
- **Conclusion:** Calendar events require fixed timezone; tasks do not

### Scenario 4: After Completion

- User in London (UTC+0), task "Check email" with `after_completion`, `delay_days = 3`
- Completed April 10 at 14:00, flew to Sydney (UTC+10) on April 11
- `completedAt` = `2026-04-10T14:00:00.000Z` (UTC)
- In Sydney timezone: completion date converts to `2026-04-11`
- `next_date` = `2026-04-11` + 3 days = `2026-04-14`

---

## Alternatives Considered

### Option A: Store timezone in RepeatRule

Add `timeZone: string` (IANA identifier) to `RepeatRule`.

**Pros:** Precision for users wanting "home" timezone binding
**Cons:** Complexity, doesn't match productivity philosophy, confusing UX, edge cases with invalid/changed IANA IDs
**Verdict:** Rejected. Solves a minority use case while creating problems for the majority.

### Option B: User-configurable behavior

Add global setting "Bind recurring tasks to creation timezone: yes/no".

**Pros:** Flexibility
**Cons:** UI complexity, two modes = two sets of bugs, most users won't change the default
**Verdict:** Premature optimization. Can be added later if real demand appears.

### Option C: Hybrid approach

Use current timezone for `daily`/`weekly`, but store timezone for `monthly`/`yearly`.

**Pros:** Balance between simplicity and precision
**Cons:** Inconsistency, complexity, doesn't solve `after_completion`
**Verdict:** Rejected. Inconsistency is worse than uniform behavior.

---

## Limitations and Edge Cases

### 1. Frequent travelers

Rare use case. For digital nomads: use task description for specific times, or use a calendar instead.

### 2. Crossing midnight

When completing a task at 23:50 and changing timezone, the completion date may shift. This is correct behavior — the date is relative to the current timezone at calculation time.

### 3. DST (Daylight Saving Time)

Temporal API handles DST automatically. Tasks continue appearing on the same day regardless of DST transitions.

### 4. Invalid timezones

Impossible. `Temporal.Now.timeZoneId()` always returns a valid IANA identifier from the system.

---

## Related Documents

- `DATE_TIME_AUDIT_REPORT.md` — item 5 (original "problem")
- `docs/adr/0002-recurring-tasks-skip-logic.md` — item 4 (timezone mention)
- `packages/client/src/utils/repeatRule.ts` — date calculation implementation
- `packages/client/src/types/common.ts` — `RepeatRule` data model
- `docs/guides/temporal-guide.md` — Temporal API usage guide

---

## Change History

- **2026-04-16**: Created ADR based on date/time handling audit (item 5)
