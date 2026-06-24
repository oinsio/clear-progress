## Context

Several features have working implementations with unit tests but lack BDD Gherkin specifications. This creates a documentation gap — behavior is verified but not formally specified. Additionally, SyncProvider.tsx has a stale traceability comment.

This change adds BDD feature files and step definitions for CompletedPage and FocusMode dimming, and fixes a traceability comment. No implementation changes.

## Goals / Non-Goals

**Goals:**
- Add BDD unit specs (vitest-cucumber) for CompletedPage view behavior
- Add BDD unit specs for FocusMode UI-dimming logic
- Fix SyncProvider.tsx traceability comment

**Non-Goals:**
- No new E2E tests (existing unit tests + new BDD specs provide sufficient coverage)
- No implementation changes to any feature
- No mutation testing of existing code (only new step definitions)

## Decisions

### Decision 1: BDD unit tests via vitest-cucumber, not playwright-bdd

BDD specs will use vitest-cucumber (unit BDD), not playwright-bdd (E2E BDD).

**Rationale**: The behaviors being specified are domain/hook-level logic (date grouping, operation routing, dimming rules), not browser interactions. vitest-cucumber is faster and more appropriate for this level.

### Decision 2: Test CompletedPage grouping via `groupCompletedTasks` utility

CompletedPage date grouping is a pure function (`groupCompletedTasks`). BDD scenarios will test this function directly rather than rendering the full page component.

**Rationale**: The grouping logic is the core behavior. Page rendering is already covered by existing unit tests in CompletedPage.test.tsx.

### Decision 3: Test FocusMode dimming via TaskList component logic

FocusMode dimming is determined by `hasFocusedTask` boolean in TaskList: `isFocusMode && (selectedTaskId != null || expandedTaskId != null)`. BDD scenarios will verify this logic.

**Rationale**: The dimming rule is a UI-state derivation that can be tested at the component logic level.

### Decision 4: Test CompletedPage operation routing via `useCompletedTaskHandlers`

Operation routing dispatches to the correct box's handler based on the task's original box. BDD scenarios will test `useCompletedTaskHandlers` hook directly.

**Rationale**: The routing logic is in the hook, not the page component.

## Risks / Trade-offs

- [Low coverage overlap] Some scenarios may overlap with existing unit tests in CompletedPage.test.tsx and TaskList.test.tsx. This is acceptable — BDD specs serve as executable documentation, not just test coverage.
