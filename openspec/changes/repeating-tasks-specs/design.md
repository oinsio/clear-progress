# Design: Repeating Tasks Specs

## Context

Repeating tasks functionality is fully implemented across multiple layers:
- `packages/contract/src/schemas/repeat-rule.ts` — Zod schema for RepeatRule
- `packages/client/src/utils/repeatRule.ts` — all calculation algorithms
- `packages/client/src/services/TaskService.ts` — recurring copy creation on completion
- `packages/client/src/services/HiddenTaskService.ts` — reveal logic
- `packages/client/src/hooks/useHiddenTasksReveal.ts` — reveal scheduling

Existing unit tests cover all algorithms but lack BDD structure. ADRs 0001 (timezone policy) and 0002 (skip logic) document key decisions.

## Goals / Non-Goals

**Goals:**
- Document behavior as executable Gherkin specs
- Organize BDD tests by frequency/concern for maintainability
- Reuse existing test utilities (fakeClock, in-memory adapters)

**Non-Goals:**
- Refactoring production code
- Adding new test infrastructure
- Testing UI components (RepeatRuleSelector, HiddenTasksToggle)

## Decisions

### D1: BDD test organization by concern

Feature files split by frequency (daily, weekly, monthly, yearly, after_completion) and by concern (parsing, appear_date, recurring_copy, hidden_reveal, timezone). This matches the existing unit test file structure and keeps each feature file under 200 lines.

Rationale: each frequency has distinct skip logic and edge cases (weekdays, end-of-month clamping, leap years). Separate files prevent bloat.

### D2: Reuse existing test infrastructure

Step definitions will use:
- `fakeClock` from `@/lib/temporal` for deterministic time
- `InMemoryTaskRepository` for persistence
- `TaskService` directly (not hooks) — testing domain logic

Rationale: existing unit tests already validate this path works. BDD tests add structured scenarios on top.

### D3: Feature file location

All feature files in `packages/client/src/test/features/repeating_tasks/`. Step files colocated as `*.steps.ts`.

Rationale: consistent with existing pattern (tasks/, goals/, ideas/, etc.).

### D4: No duplication of unit test assertions

BDD scenarios focus on business-level behavior (Given/When/Then in user terms). Detailed edge-case coverage remains in existing unit tests. BDD tests complement but don't replace them.

## Risks / Trade-offs

- **Risk**: BDD step definitions may become verbose for complex date scenarios → mitigate by using `it.each`-style Scenario Outlines with Examples tables
- **Trade-off**: Some overlap between BDD scenarios and existing unit tests → acceptable for documentation value and regression safety
