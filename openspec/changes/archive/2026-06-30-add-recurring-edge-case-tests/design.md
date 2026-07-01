## Context

ADR-0002 and skip-logic.md document two next_date computation models, but the user rationale (why daily = "from today" while weekly/monthly/yearly = "by schedule") is only captured in chat history. Tests cover basic cases but miss early completion (advance_days > 0, prev > today) for all frequencies, daily skip exact alignment BDD, and clamping chains for monthly.

Context: driven by FR1-FR16 from proposal.

## Goals / Non-Goals

**Goals:**
- D1: Update ADR-0002 with user rationale for each model across all frequencies
- D2: Add BDD scenarios to existing feature files for all uncovered cases
- D3: Add unit tests to skip-logic.test.ts for early completion and clamping

**Non-Goals:**
- Changing computation logic — tests and documentation only
- Refactoring existing tests

## Decisions

### D1: Update existing ADR-0002 rather than creating a new one

ADR-0002 already describes skip-logic and two models. We add a "User Rationale" section with reasoning from the discussion. No ADR-0003 needed since the decision itself is unchanged — we're supplementing documentation.

### D2: Add BDD tests to existing feature files

Early completion and clamping scenarios logically belong to existing feature files (next_date_daily.feature, next_date_weekly.feature, next_date_monthly.feature, next_date_yearly.feature). Creating separate feature files is not warranted.

### D3: Add unit tests to skip-logic.test.ts

All edge case scenarios (prev > today, clamping chains) are skip-logic variations. Add to the existing file. If it exceeds 300 lines, extract early completion tests into a separate repeatRule.early-completion.test.ts file.

### D4: Early completion scenarios test calculateNextDate directly

Early completion = calling calculateNextDate with previousNextDate > today. This is a pure unit test at the utility level, no TaskService needed.

### D5: Daily BDD gaps are added alongside weekly/monthly/yearly

Two daily scenarios exist in the spec but lack BDD tests: early completion via advance_days and skip logic exact alignment. These are added to next_date_daily.feature.

## Risks / Trade-offs

- [Risk] skip-logic.test.ts may exceed 200 lines → extract early completion tests into repeatRule.early-completion.test.ts if threshold breached
- [Risk] Existing step definitions may not support new Given/When/Then phrasing → check and extend as needed
