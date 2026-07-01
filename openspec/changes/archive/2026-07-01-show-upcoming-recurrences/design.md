## Context

Driven by FR1-FR9 from proposal.

Currently TaskDetailsTab only displays the repeat rule label (via `formatRepeatRuleLabel`). The concrete `next_date` is not shown even though the data is already available in `task.next_date`. RepeatRuleSelector has no date preview.

Existing date formatting patterns in the project:
- `Intl.DateTimeFormat` with `day: "numeric"`, `month: "short"` for short dates
- Relative format "today/tomorrow" in `formatShortDateTime` (shared/lib/utils.ts)
- i18n keys `repeat.weekday1..7` for short weekdays, `repeat.monthGenitive1..12` for months

## Goals / Non-Goals

**Goals:**
- Utility `calculateUpcomingDates` for generating N dates by rule
- Utility `formatNextDate` for human-readable format with relative (FR3, FR4)
- UI display in TaskDetailsTab and RepeatRuleSelector

**Non-Goals:**
- Caching or memoization of date calculation (computing 5 dates takes ~microseconds)
- New i18n keys for full weekday names — using existing short forms

## Decisions

### D1: calculateUpcomingDates — sequential chain

The utility takes `(rule, startDate, count, clock)` and returns an array of ISO dates. Each next date is computed from the previous one via the unified algorithm `resolveNextFixedDate` (from `unify-next-date-calculation`) in `from-schedule` mode. The first date is `startDate` (or the result of `nearest-match` from today if startDate is not provided).

**Alternative**: compute all dates via `nearest-match` from today with increment. Rejected because it does not reproduce the real rhythm (interval is applied when transitioning between weeks/months, not from today).

For `after_completion` — return an empty array (FR9).

### D2: formatNextDate — Intl.DateTimeFormat + relative

Use `Intl.DateTimeFormat` (as in the existing `formatShortDateTime`) rather than i18n templates for dates. Reason: `Intl` automatically handles locale, day/month order, and declensions.

Logic:
1. If date === today -> i18n "today"
2. If date === tomorrow -> i18n "tomorrow"
3. If date is in the current year -> `Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" })` -> "Wed, Jul 2"
4. If date is in a different year -> add `year: "numeric"` -> "Jan 15, 2027"
5. For daily (FR4) — without `weekday` in options

### D3: formatUpcomingDate — uniform format for preview

In the RepeatRuleSelector preview, always use the absolute format with weekday (no relative "today/tomorrow") so the date list is visually rhythmic. For daily — without weekday (FR4).

### D4: UI placement

**TaskDetailsTab**: Below the repeat rule DrillDownRow, add a `<p>` with secondary styling (`text-xs text-gray-500`), similar to existing labels. Not a DrillDownRow — this is an informational line, not a clickable element.

**RepeatRuleSelector**: At the bottom of Step 2 (after frequency configuration), add a `<ul>` with the date list. Show only when the rule is fully configured (all required fields are filled). Hide for `after_completion`.

### D5: File structure

- `packages/client/src/utils/upcomingDates.ts` — `calculateUpcomingDates`
- `packages/client/src/utils/formatRecurrenceDate.ts` — `formatNextDate`, `formatUpcomingDate`
- Both utilities are exported through `repeatRule.ts` index

## Risks / Trade-offs

- [Risk] RESOLVED: `calculateUpcomingDates` depends on `resolveNextFixedDate` from `unify-next-date-calculation` -> `unify-next-date-calculation` is implemented and archived; `resolveNextFixedDate` is available in `repeatRule.ts`
- [Trade-off] `Intl.DateTimeFormat` formats differently across browsers (dot vs comma after weekday) -> Acceptable for PWA, primary audience is Chrome on Android
