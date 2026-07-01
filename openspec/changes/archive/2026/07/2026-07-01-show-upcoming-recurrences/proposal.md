# show-upcoming-recurrences

## Why

The user cannot see when a recurring task will fire next. TaskDetailsTab only shows the repeat rule label ("Every 2 weeks, Mon, Wed") but not a concrete date. When configuring a rule in RepeatRuleSelector, the user cannot verify the rhythm — they have to mentally calculate dates. This is especially critical for complex rules (biweekly with multiple weekdays, monthly with leap-month edge cases).

## What Changes

- **ADDED**: Line "Next: Wed, Jul 2" in TaskDetailsTab below the repeat rule row — shows the task's `next_date` in a human-readable format
- **ADDED**: Preview of the 5 nearest dates in RepeatRuleSelector — a list of dates at the bottom of the selector helping to visually verify the schedule rhythm
- **ADDED**: Utility `calculateUpcomingDates(rule, count)` — generates a list of the nearest N dates for a repeat rule
- **ADDED**: Recurrence date formatting utility with relative format (today/tomorrow/date with weekday)

## Goals

- G1: User sees the concrete next recurrence date in task details without mentally calculating it
- G2: User sees the schedule rhythm when configuring a repeat rule and can verify its correctness

## Non-Goals

- NG1: Showing `next_date` on the task card (TaskItem) — may overload the compact list UI
- NG2: Manually editing `next_date` — the date is calculated automatically
- NG3: Showing missed dates or recurrence history
- NG4: Notifications about upcoming recurrences

## Users & Scenarios

- U1: User opens details of a recurring task and immediately sees when it will repeat (e.g., "Next: tomorrow" or "Next: Mon, Jul 14")
- U2: User configures the rule "every 2 weeks, Mon and Wed" and sees 5 dates in the preview confirming the expected rhythm: Mon Jul 7, Wed Jul 9, Mon Jul 21, Wed Jul 23, Mon Aug 4
- U3: User configures the rule "every month, 31st" and sees in the preview that February will be the 28th — clamping works

## Requirements

### Functional

- FR1: TaskDetailsTab MUST show a line with the task's `next_date` below the repeat rule row if the task has a `repeat_rule` and `next_date` is non-empty
- FR2: If `next_date` is empty (`after_completion` type, task never completed yet), the line MUST show the text "after completion"
- FR3: Date format MUST be relative: "today" / "tomorrow" for near dates, "Wed, Jul 2" for dates within the current or next week, "Jul 15" for distant dates in the current year, "Jan 15, 2027" for dates in a different year
- FR4: For daily frequency, weekday MUST NOT be shown in the format (redundant for daily tasks)
- FR5: RepeatRuleSelector MUST show a preview of 5 upcoming dates at the bottom of the selector when the rule is fully configured (all required fields are filled)
- FR6: Date preview MUST update on every change to rule parameters (frequency, interval, weekdays, etc.)
- FR7: Date format in the preview MUST be uniform: "Wed, Jul 2" (weekday short + day + month short), without relative "today/tomorrow" format
- FR8: The `calculateUpcomingDates` utility MUST sequentially compute N next dates using the unified calculation algorithm from `unify-next-date-calculation`
- FR9: For `after_completion` type, date preview MUST NOT be shown (dates depend on the moment of completion and cannot be predicted)

### Non-Functional

#### Accessibility

- NFR-A1: The `next_date` line in TaskDetailsTab MUST be readable by screen readers
- NFR-A2: The preview date list MUST have semantic markup (`<ul>` / `<ol>`)

#### Responsive

- NFR-R1: Date preview MUST render correctly on screens from 320px

## UX Acceptance Criteria

- UX1: The `next_date` line is visually subordinate to the repeat rule row — smaller font, secondary text color
- UX2: Date preview in the selector MUST NOT occupy more than ~30% of the visible selector area height
- UX3: When switching the type to `after_completion`, the preview smoothly hides

## Behavior

Scenarios will be described in:
- `packages/client/src/test/features/repeating_tasks/upcoming_dates.feature`

## Visual Reference

No Figma mockups. Follow existing TaskDetailsTab patterns (DrillDownRow, secondary text).

## Affected IA

No changes.

## Success Metrics

- M1: 100% of recurring tasks with a non-empty `next_date` show a formatted date in details
- M2: Date preview updates synchronously on any rule parameter change — no delays
- M3: Mutation score >= 95% on `calculateUpcomingDates` and the formatting utility

## Open Questions

None.

## Capabilities

### New Capabilities

- `upcoming-recurrence-preview`: Calculation and display of upcoming recurrence dates — calculateUpcomingDates utility, date formatting, UI components in TaskDetailsTab and RepeatRuleSelector

### Modified Capabilities

No changes to existing capabilities — only read-only access to `next_date` and calls to calculation algorithms are used.

## Impact

- `packages/client/src/utils/` — new `calculateUpcomingDates` utility, date formatting utility
- `packages/client/src/components/tasks/TaskDetailsTab.tsx` — next_date line
- `packages/client/src/components/tasks/RepeatRuleSelector.tsx` — date preview section
- `packages/client/src/locales/ru.json`, `en.json` — i18n keys for date formats
- Dependency: `unify-next-date-calculation` (unified date calculation algorithm)
