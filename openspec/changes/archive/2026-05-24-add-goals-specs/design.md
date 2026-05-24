# Design: Add Goals Specs

## Context

Goals feature is fully implemented but has no formal specification or BDD tests. Existing unit tests (GoalService.*.test.ts, useGoal*.test.ts, GoalItem.test.tsx, etc. — 25+ test files) use mocked repositories. Need to decide whether to migrate them to BDD or keep both. Driven by G1, G2 from proposal.

## Decision

### D1: Keep existing unit tests alongside BDD tests

**Decision:** Existing unit tests stay as-is. BDD tests are added separately using real repositories with fake-indexeddb.

**Why:** They test different things:
- Existing tests verify internal contract (mocked repo calls, argument passing)
- BDD tests verify observable behavior (data actually persisted in IndexedDB)

Both provide value and complement each other.

**Alternative — migrate existing tests to BDD:** Rejected because migration is busy work with no net gain. Existing tests already cover edge cases well.

### D2: Follow Ideas BDD test structure

**Decision:** Use the same file organization as Ideas BDD tests: one .feature file per concern (crud, dirty_flag, ordering, search, soft_delete), plus goals-specific files for statuses, covers, and task grouping.

**Why:** Consistency with existing patterns reduces cognitive load. The Ideas pattern is proven and well-understood.

**Alternative — one large .feature file:** Rejected because it would exceed the 400-line file limit and be harder to navigate.

### D3: Reuse shared BDD helpers pattern

**Decision:** Create `test/helpers/bdd/goals/` with shared step definitions, assertions, and helpers — same pattern as `test/helpers/bdd/goalFocus/`.

**Why:** Reduces duplication across feature files. Factory functions and common Given/When/Then steps are shared.

## Consequences

Positive:
- No risk of regression from test migration
- Better total coverage (internal + behavioral)
- Consistent structure with Ideas, Categories, Contexts BDD tests

Negative:
- Some overlap in test scenarios (acceptable — different testing approaches)
