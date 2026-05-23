# Design: Add i18n Specs

## Context

i18n is fully implemented but has no formal specification or BDD tests. Existing unit tests in `LanguageProvider.test.tsx` cover 3 basic scenarios with mocked i18n. Need to decide testing strategy for locale registry (which uses `import.meta.glob`) and translation completeness. Driven by G1, G2, G3 from proposal.

## Decision

### D1: Keep existing LanguageProvider unit tests alongside BDD tests

**Decision:** Existing `LanguageProvider.test.tsx` stays as-is. BDD tests are added separately with focused scenarios.

**Why:** Existing tests verify React rendering behavior (component mounting, button clicks). BDD tests verify business rules (detection priority, fallback chains, persistence logic) at the service level.

**Alternative -- migrate existing tests to BDD:** Rejected because migration is busy work with no net gain.

### D2: Test locale registry via direct import, not import.meta.glob

**Decision:** BDD tests for locale registry import `localeRegistry.ts` functions directly and test their observable behavior (locales list, validation results). Do not test the Vite glob mechanism itself.

**Why:** `import.meta.glob` is a build-time Vite feature. Testing it requires Vite test environment which vitest already provides. The registry functions (`getLocaleByCode`, `isValidLocaleCode`, `getBaseLanguageCodes`) are pure and testable.

**Alternative -- mock import.meta.glob:** Rejected because it couples tests to implementation details.

### D3: Translation completeness via JSON key comparison

**Decision:** BDD test reads both locale JSON files and compares keys structurally. Test verifies that every key path in `ru.json` exists in `en.json` and vice versa (excluding `_meta`).

**Why:** This is a simple, fast, deterministic check that catches the most common i18n bug (adding a key to one file but not the other). No runtime i18next needed.

**Alternative -- runtime missing key detection via i18next missingKey handler:** Rejected because it only catches keys that are actually used in rendered components, not all keys.

## Consequences

Positive:
- No risk of regression from test migration
- Completeness check catches missing translations at test time, not in production
- Tests are fast (no browser, no real i18next initialization needed for most scenarios)

Negative:
- Some overlap between existing unit tests and new BDD scenarios for LanguageProvider (acceptable)
