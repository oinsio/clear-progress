# Design: Adapter In-Memory Spec

## Context

The InMemorySyncAdapter is implemented in `packages/adapter-inmemory/src/in-memory-sync-adapter.ts` as a single class (~390 lines) that implements the full `SyncAdapter` interface using in-memory Maps. It is used as a test double in contract tests (`packages/adapter-inmemory/tests/contract.test.ts`) and can be used in BDD feature tests. The adapter already passes the shared contract test suite from `@clear-progress/contract/contracts`.

This change adds formal specs and BDD tests for the adapter's behavior (FR1-FR12 from proposal).

## Goals / Non-Goals

**Goals:**
- Create openspec spec documenting in-memory adapter behavior as the authoritative reference
- Add BDD feature files and step definitions for all adapter operations
- Follow established patterns from adapter-loader-spec and settings-specs-and-bdd BDD tests

**Non-Goals:**
- No refactoring of existing adapter code
- No changes to the shared contract test suite
- No tests for other adapter implementations

## Decisions

### Decision 1: BDD tests instantiate InMemorySyncAdapter directly

BDD steps will create a fresh `InMemorySyncAdapter()` instance in `BeforeEachScenario`. No mocking needed since the adapter is entirely in-memory with no external dependencies. This is simpler than the pattern used for settings BDD tests (which need fake-indexeddb) or adapter-loader tests (which need vi.mock).

Alternative considered: Reuse shared contract tests as BDD — rejected because contract tests verify the interface, while BDD tests document specific adapter behaviors in Gherkin format for specification purposes.

### Decision 2: Six feature files split by operation type

Split into lifecycle, push, pull, settings, covers, and purge. Each file focuses on one aspect of the adapter, matching the SyncAdapter interface method groups. This keeps files focused and under the 400-line limit.

Alternative considered: Single large feature file — rejected because it would exceed 400 lines and mix unrelated concerns.

### Decision 3: Steps files import directly from adapter-inmemory package

Since `@clear-progress/adapter-inmemory` is a workspace package with proper exports, steps will import `InMemorySyncAdapter` directly. Wire entity factories will be defined locally in the steps files (following the pattern from the contract test).

Alternative considered: Creating shared factories in a test-utils module — rejected because the factories are simple object literals and duplicating them in steps keeps each file self-contained.

## Risks / Trade-offs

- [Risk] BDD tests may overlap with existing contract tests — Mitigation: BDD tests focus on behavior descriptions in Gherkin for specification purposes, contract tests focus on interface compliance. Both serve different audiences (spec readers vs implementers).
- [Risk] Specs may drift from implementation — Mitigation: BDD tests serve as executable specs, keeping them in sync.
