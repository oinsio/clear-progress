# Repeating Tasks Specs

## Why

Repeating (recurring) tasks are a core feature — they handle daily routines, weekly reviews, and periodic chores. The functionality is fully implemented (repeat_rule parsing, next_date calculation with skip logic, timezone handling, hidden task reveal, recurring copy creation) and covered by unit tests, but there are no formal specifications (openspec) or BDD tests (.feature + steps). This mirrors the gap that task-core-specs filled for basic task operations.

Documenting existing repeating tasks behavior as specs + BDD tests will:
- Establish a single source of truth for recurring task behavior
- Catch regressions in complex date calculations via executable Gherkin scenarios
- Enable safe refactoring of skip logic and timezone handling

## What Changes

- **ADDED** `repeating-tasks` capability spec documenting repeat rule parsing, next date calculation, skip logic, timezone behavior, recurring copy creation, hidden task reveal, and advance days
- **ADDED** BDD unit tests (.feature + .steps.ts) covering all repeating task scenarios

No code changes to production logic. This is a documentation + test-only change.

## Capabilities

### New Capabilities
- `repeating-tasks`: Repeat rule lifecycle — parsing, serialization, next date calculation (daily/weekly/monthly/yearly/after_completion), skip logic for missed days, timezone adaptation, advance days, hidden task reveal, recurring copy creation on completion

### Modified Capabilities
- `tasks`: Add reference to repeating-tasks spec for FR3 (completion with repeat_rule)

## Goals

- **G1**: Every repeating task operation has a formal requirement in the spec
- **G2**: Every requirement has at least one BDD scenario with passing step definitions
- **G3**: BDD test coverage aligns with existing unit test coverage (no gaps)

## Non-Goals

- **NG1**: UI components for repeat rule selector — separate concern (UI tests)
- **NG2**: Sync behavior of recurring copies — already covered by sync-protocol specs
- **NG3**: Changing any existing production code or behavior
- **NG4**: E2E tests — this change focuses on domain/service layer BDD

## Users & Scenarios

- **U1**: Developer modifying skip logic — reads spec to understand expected behavior, runs BDD tests to verify changes
- **U2**: AI agent adding a new frequency type — uses spec as context for the pattern

## Requirements

### Functional

- **FR1**: Repeat rule parsing — parse JSON string to RepeatRule object; invalid/empty JSON returns null
- **FR2**: Repeat rule serialization — serialize RepeatRule to JSON string; format label for display (i18n)
- **FR3**: Next date calculation (fixed daily) — add interval days to previous next_date; skip logic aligns to future
- **FR4**: Next date calculation (fixed weekly) — find next matching weekday from weekdays list respecting interval; skip logic aligns to future week period
- **FR5**: Next date calculation (fixed monthly) — advance by interval months; handle end-of-month clamping (e.g. 31st in Feb becomes 28th); skip logic skips past months
- **FR6**: Next date calculation (fixed yearly) — advance by interval years; handle Feb 29 in non-leap years; skip logic skips past years
- **FR7**: Next date calculation (after_completion) — add delay_days to completion date; NO skip logic applied
- **FR8**: Appear date calculation — appear_date = next_date minus advance_days; minimum is next_date itself when advance_days is 0
- **FR9**: Recurring copy creation — on task completion with repeat_rule: calculate next_date, create copy with new ID, reset completion state, copy checklist items with new IDs, set original_task_id
- **FR10**: Hidden task management — new recurring copy is hidden (is_hidden=true) if appear_date > today; revealed when appear_date <= today
- **FR11**: Reveal triggers — reveal hidden tasks on app mount, at midnight, on sync_complete, on visibility change (return from background)
- **FR12**: Timezone adaptation — use current system timezone for all date calculations; no timezone stored in repeat_rule
- **FR13**: Existing hidden copy update — if a hidden recurring copy already exists when completing, update it instead of creating a new one

### Non-Functional

#### Performance

- **NFR-P1**: Next date calculation completes within 1ms for any frequency

#### Accessibility

N/A (no UI in this change)

#### Responsive

N/A (no UI in this change)

## UX Acceptance Criteria

- **UX1**: After completing a repeating task, the next occurrence appears in the correct box at the right time
- **UX2**: If user hasn't opened the app for days, only one future occurrence appears (no backlog flood)

## Behavior

BDD scenarios defined in:
- `features/repeating_tasks/repeat_rule_parsing.feature` — FR1, FR2
- `features/repeating_tasks/next_date_daily.feature` — FR3
- `features/repeating_tasks/next_date_weekly.feature` — FR4
- `features/repeating_tasks/next_date_monthly.feature` — FR5
- `features/repeating_tasks/next_date_yearly.feature` — FR6
- `features/repeating_tasks/next_date_after_completion.feature` — FR7
- `features/repeating_tasks/appear_date.feature` — FR8
- `features/repeating_tasks/recurring_copy.feature` — FR9, FR13
- `features/repeating_tasks/hidden_task_reveal.feature` — FR10, FR11
- `features/repeating_tasks/timezone_adaptation.feature` — FR12

All scenarios tagged `@repeating-tasks-specs`.

## Visual Reference

No visual changes. Existing UI components remain unchanged.

## Affected IA

No changes to information architecture.

## Success Metrics

- **M1**: 100% of FR1-FR13 have at least one BDD scenario
- **M2**: All BDD step definitions pass
- **M3**: Mutation score >= 90% on repeating task utility/service code (existing + new tests combined)

## Open Questions

None.
