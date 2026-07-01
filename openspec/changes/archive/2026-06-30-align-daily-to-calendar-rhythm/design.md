## Context

Daily fixed frequency currently uses Model A ("from today"): `next_date = today + interval`. This makes it indistinguishable from `after_completion` with `delay_days = interval`. All other fixed frequencies (weekly, monthly, yearly) use Model B ("by schedule") — advancing from `previousNextDate` with early-completion preservation and skip logic.

Context: driven by FR1-FR6 from proposal.

Current implementation in `calculateNextDateDaily`:
```typescript
function calculateNextDateDaily(interval, _previousNextDate, clock) {
  return clock.plainDateISO().add({ days: interval }).toString();
}
```

The `_previousNextDate` parameter is accepted but ignored.

## Goals / Non-Goals

**Goals:**
- Align `calculateNextDateDaily` with the pattern used by weekly/monthly/yearly
- Reuse the same early-completion and skip-logic patterns

**Non-Goals:**
- Changing the public API surface or adding new parameters to `calculateNextDate`
- Modifying weekly/monthly/yearly logic

## Decisions

### Decision 1: Daily uses "by schedule" model (FR1, FR2, FR3)

Rewrite `calculateNextDateDaily` to accept `previousNextDate` and `completedAtDate`, following the same pattern as `calculateNextDateMonthly`:

1. **Early completion check**: if `completedAtDate < prev` → return `prev` (FR2)
2. **Candidate**: `prev + interval`
3. **Skip logic**: if `candidate <= today` → skip to nearest future date aligned to interval grid (FR3)

Skip algorithm:
```
daysElapsed = prev.until(today).days
periodsToSkip = ceil(daysElapsed / interval)
candidate = prev + periodsToSkip * interval
if candidate <= today → candidate + interval
```

### Decision 2: nearest-match respects interval (FR4)

Unlike weekly (which uses `NEAREST_INTERVAL = 1`), daily nearest-match returns `today + interval`. Rationale: weekly has a weekday pattern to match; daily has only interval. Using interval=1 would make "every 3 days" start tomorrow, which contradicts user intent.

### Decision 3: ADR-0002 updated, not superseded

The change is within the same ADR scope (skip logic models). Daily moves from Model A to Model B. The ADR will be updated with a new Change History entry and revised model assignments. A new ADR is unnecessary since no new architectural pattern is introduced.

### Decision 4: skip-logic.md rule file updated (FR6)

`.claude/rules/skip-logic.md` will move daily from Model A to Model B. Model A will only contain `after_completion`.

## Risks / Trade-offs

- **[Risk] Existing daily tests will break** → Expected and intentional. All daily test expectations need updating to reflect the new model.
- **[Risk] Users may notice behavior change for daily tasks** → Only visible in edge cases (early completion, long inactivity). Normal daily completion with interval=1 produces the same result (`tomorrow`).
- **[Trade-off] `after_completion` becomes the only Model A frequency** → Acceptable — it's semantically distinct (triggered by completion event, not calendar).
