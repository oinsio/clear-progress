## Context

Settings functionality is fully implemented across multiple layers:
- **SettingsRepository** — IndexedDB CRUD with sync flags (`needsSync`, `updated_at`)
- **SettingsService** — thin business logic layer with typed getters (`getDefaultBox`, `getAccentColor`)
- **useSettings hook** — React hook for synced settings with localStorage caching and `schedulePush`
- **Local preference hooks** — `useFocusMode`, `usePanelSide`, `useFilterBarPosition`, `useInterfaceScale`, etc. — localStorage-only

Existing unit tests cover all these layers but lack BDD feature files. Other entities (tasks, goals, ideas, contexts, categories, checklists) all have openspec specs and BDD tests. Settings is the gap.

## Goals / Non-Goals

**Goals:**
- Create openspec specs documenting settings behavior as the authoritative reference
- Add BDD feature files and step definitions for settings repository, service, and hooks
- Follow established patterns from other entity BDD tests (vitest-cucumber)

**Non-Goals:**
- No refactoring of existing settings code
- No E2E tests (settings-sync E2E already exists in integration package)
- No menu-order BDD (already covered by `menu_order` spec and feature files)
- No SettingsPage component tests (already exist)

## Decisions

### Decision 1: Two separate capability specs

Split into `settings` (synced settings — repository, service, sync protocol) and `local-preferences` (localStorage-only hooks). Rationale: they have fundamentally different storage, lifecycle, and sync behavior.

Alternative considered: single monolithic spec — rejected because it would mix two distinct persistence strategies and exceed the 400-line file limit.

### Decision 2: BDD tests at repository and service level, not hook level

Focus BDD tests on `SettingsRepository` and `SettingsService` since these contain the domain logic (idempotent writes, conflict resolution, bulk upsert, default values). Hook tests already exist as standard vitest tests and don't benefit from Gherkin format (they test React rendering behavior, not business rules).

For local preferences, add BDD tests only for hooks that have non-trivial logic (focus mode with opacity parsing, section collapse with JSON serialization).

Alternative considered: BDD tests for all hooks — rejected because most local preference hooks are trivial get/set with no business logic worth expressing in Gherkin.

### Decision 3: Use fake-indexeddb for repository BDD steps

Follow the established pattern from other BDD tests — use `fake-indexeddb` for Dexie operations, matching the existing test infrastructure.

## Risks / Trade-offs

- [Risk] Specs may drift from implementation → Mitigation: BDD tests serve as executable specs, keeping them in sync
- [Risk] Feature files may overlap with existing unit tests → Mitigation: BDD tests focus on behavior descriptions (Given-When-Then), not implementation details. Existing tests can be gradually replaced or kept as complementary coverage
