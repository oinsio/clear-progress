# Design: Add Context & Category Specs

## Context

Context and Category features are fully implemented but have no formal specification or BDD tests. Existing unit tests (ContextService.*.test.ts, CategoryService.*.test.ts) use mocked repositories. Need to decide whether to migrate them to BDD or keep both. Driven by G1 from proposal.

## Decision

### D1: Keep existing unit tests alongside BDD tests

**Decision:** Existing unit tests stay as-is. BDD tests are added separately using real repositories with fake-indexeddb.

**Why:** They test different things:
- Existing tests verify internal contract (mocked repo calls, argument passing)
- BDD tests verify observable behavior (data actually persisted in IndexedDB)

Both provide value and complement each other.

**Alternative — migrate existing tests to BDD:** Rejected because migration is busy work with no net gain. Existing tests already cover edge cases well.

### D2: Single change for both entities

**Decision:** Context and Category specs are delivered in one change, with separate capability spec files.

**Why:** Both entities are structurally identical (same fields, same operations, same service pattern). Separate changes would duplicate all OpenSpec boilerplate for no benefit.

**Alternative — two separate changes:** Rejected because it doubles the overhead with no practical gain.

## Consequences

Positive:
- No risk of regression from test migration
- Better total coverage (internal + behavioral)
- Efficient delivery of two specs in one change

Negative:
- Some overlap in test scenarios (acceptable for small features)
