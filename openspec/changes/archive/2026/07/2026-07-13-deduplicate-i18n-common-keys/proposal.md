# Deduplicate i18n Common Keys

## Why

The `i18n:check` script reports ~30 groups of duplicate values across `en.json` and `ru.json`. Many are genuinely shared UI labels (Cancel, Back, Delete, Close) repeated 5-10 times under different namespaces. This increases maintenance cost when adding new languages or updating wording, and creates noise in the i18n check output, masking real issues.

## What Changes

- **ADDED**: `common` namespace in `en.json` / `ru.json` for shared UI labels
- **MODIFIED**: ~20 components to reference `common.*` keys instead of domain-specific duplicates
- **REMOVED**: ~35 redundant i18n keys replaced by `common.*`
- **MODIFIED**: `i18n-check` script whitelist to accept intentional domain-term duplicates
- **REMOVED**: Dead keys (`context.saveName`, `category.saveName`) if confirmed unused

## Capabilities

### New Capabilities

_None_ — this is a refactoring of existing i18n infrastructure.

### Modified Capabilities

- `i18n`: Adding `common` namespace convention; removing dead keys
- `i18n-check`: Extending whitelist with intentional duplicate patterns

## Goals

- **G1**: Eliminate unintentional i18n key duplication — shared UI labels exist in one place
- **G2**: Clean `i18n:check` output — zero informational duplicates reported

## Non-Goals

- **NG1**: Changing any user-visible text or translations
- **NG2**: Adding new languages
- **NG3**: Refactoring the i18n-check script beyond whitelist changes
- **NG4**: Changing how i18next is configured or initialized

## Users & Scenarios

- **U1**: Developer adding a new dialog — uses `t("common.cancel")` instead of creating yet another `*.cancel` key
- **U2**: Developer adding a 3rd language — translates `common.cancel` once instead of 10 times
- **U3**: Developer running `i18n:check` — sees clean output without noise from known duplicates

## Requirements

### Functional

- **FR1**: Create `common` namespace in both `en.json` and `ru.json` with shared keys: `cancel`, `back`, `delete`, `close`, `next`, `save`, `loading`, `name`, `taskCount`, `details`, `attachments`, `saveName`
- **FR2**: Remove the original domain-specific keys that are replaced by `common.*`
- **FR3**: Update all `t()` call sites in components to use `common.*` keys
- **FR4**: Add whitelist entries in `i18n-check` for intentional domain-term duplicates (inbox, today, later, all, yesterday, tasks, goals, ideas, contexts, categories, memos, deleted)
- **FR5**: Add whitelist entries for intentional semantic-pair duplicates (label vs ariaLabel, indicator vs legend, button vs type)
- **FR6**: Extract `context.saveName` and `category.saveName` into `common.saveName` (confirmed alive — used dynamically via `i18nKeys` in `EntityDetailLayout`)
- **FR7**: `pnpm run i18n:check` produces zero duplicate warnings after changes

### Non-Functional

#### Performance

- **NFR-P1**: No runtime performance impact — i18next key lookup is O(1) regardless of namespace

#### Accessibility

- **NFR-A1**: No a11y impact — translations remain identical, only key paths change

## UX Acceptance Criteria

- **UX1**: All user-facing text remains exactly the same before and after the change
- **UX2**: No missing translations — every `t()` call resolves to a valid key

## Behavior

No new Gherkin scenarios needed — this is a structural refactoring with no behavior change.

Existing i18n BDD tests in `src/test/features/i18n/` must continue to pass.

## Visual Reference

No visual changes.

## Affected IA

No changes.

## Success Metrics

- **M1**: `pnpm run i18n:check` reports 0 duplicate groups (currently ~30)
- **M2**: Net reduction of ~35 i18n keys across locale files
- **M3**: All existing tests pass (unit, BDD, i18n-check)
- **M4**: Build succeeds (`pnpm run build`)

## Open Questions

- ~~**Q1**: Are `context.saveName` and `category.saveName` truly dead keys?~~ **Resolved**: alive — passed dynamically via `i18nKeys.saveName` in `EntityDetailLayout` from `ContextDetailPage` and `CategoryDetailPage`.
