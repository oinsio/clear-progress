## Context

Context: driven by FR1-FR5 from proposal.

Recurring task skip logic has two computation models that were not previously recognized as distinct. The current code treats daily like weekly/monthly/yearly (schedule-based), but user expectations for daily are different: "I did it today, next one in N days." This mismatch causes daily to return today instead of tomorrow.

Additionally, yearly uses `< 0` boundary (allows today), while monthly uses `<= 0` (strictly after today). User expects all schedule-based frequencies to be strictly after today.

## Goals / Non-Goals

**Goals:**
- Align `calculateNextDateDaily` to "today + interval" model (FR1, FR2)
- Align `calculateNextDateYearly` boundary to `<= 0` like monthly (FR3)
- Update ADR-0002 and skip-logic rule to document both models (FR4)
- Add missing daily skip tests (FR5)

**Non-Goals:**
- Changing weekly/monthly logic (already correct)
- Changing after_completion logic (already correct)
- Refactoring the overall architecture

## Decisions

### D1: Daily uses `today + interval`, not schedule-aligned skip

**Decision**: Replace the skip-logic algorithm in `calculateNextDateDaily` with `today + interval`.

**Rationale**: Daily tasks represent habits or routines where the interval counts from the last execution, not from an abstract schedule. The user said: "I did it today, I need it again in N days." This is semantically identical to `after_completion` but triggered differently.

**Alternative considered**: Keep schedule-based skip and add `+1` adjustment. Rejected because it adds complexity without benefit — the schedule origin is irrelevant for daily.

**Implementation**: The function simplifies to:
```typescript
function calculateNextDateDaily(interval, previousNextDate, clock) {
  const prev = Temporal.PlainDate.from(previousNextDate);
  const today = clock.plainDateISO();
  // If prev is in the future (early completion via advance_days),
  // still count from today — user did it today, next in N days.
  return today.add({ days: interval }).toString();
}
```

Wait — this ignores the normal path where prev == today (no skip needed). But even then, `today + interval` gives the correct answer. And for early completion (prev > today), the user confirmed they want `today + interval` too (scenario 9). So the function truly simplifies to one line for all cases.

### D2: Yearly boundary `< 0` changes to `<= 0`

**Decision**: Change `Temporal.PlainDate.compare(candidate, today) < 0` to `<= 0` in `calculateNextDateYearly`.

**Rationale**: User confirmed (scenario 8): completing a yearly task on the scheduled date means "I already did it this year, next one is next year." This matches monthly behavior which already uses `<= 0`.

**Alternative considered**: Change monthly to `< 0` instead. Rejected because user confirmed monthly `<= 0` is correct (scenario 6).

### D3: No changes to weekly skip logic

Weekly already returns nearest weekday strictly after today (uses `>= 0` in weekday finder, but starts from `prev + 1`, so effectively > today for the prev). The user confirmed this is correct.

### D4: ADR-0002 update scope

Update the daily example to show `today + interval` model. Add a section documenting the two models. Remove the incorrect two-step algorithm description.

## Risks / Trade-offs

[Risk: Daily behavior change breaks existing recurring chains] → Low risk. The change only affects the next calculated date, not stored data. Existing hidden copies will be updated on next completion. No migration needed.

[Risk: Yearly boundary change moves existing yearly tasks forward by one period] → Only affects tasks completed exactly on the scheduled date. Edge case, correct behavior per user expectation.

[Trade-off: Daily loses schedule alignment] → Intentional. User explicitly prefers "today + N" over schedule alignment. This means `every 3 days` from April 10, completed on April 20, gives April 23 (not April 22 which would be schedule-aligned).
