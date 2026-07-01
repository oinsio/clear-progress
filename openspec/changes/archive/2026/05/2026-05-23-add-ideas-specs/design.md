# Design: Add Ideas Specs

## Context

Ideas feature is fully implemented but has no formal specification or BDD tests. Existing unit tests (IdeaService.*.test.ts, ~39 tests) use mocked repositories. Need to decide whether to migrate them to BDD or keep both. Driven by G1, G2 from proposal.

## Decision

### D1: Keep existing unit tests alongside BDD tests

**Decision:** Existing unit tests stay as-is. BDD tests are added separately using real repositories with fake-indexeddb.

**Why:** They test different things:
- Existing tests verify internal contract (mocked repo calls, argument passing)
- BDD tests verify observable behavior (data actually persisted in IndexedDB)

Both provide value and complement each other.

**Alternative — migrate existing tests to BDD:** Rejected because migration is busy work with no net gain. Existing tests already cover edge cases well.

## Consequences

Positive:
- No risk of regression from test migration
- Better total coverage (internal + behavioral)

Negative:
- Some overlap in test scenarios (acceptable for a small feature)
