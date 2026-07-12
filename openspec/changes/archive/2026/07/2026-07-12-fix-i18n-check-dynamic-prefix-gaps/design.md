## Context

The `i18n-check` tool scans source files for translation key usage and compares against locale JSON files. Three gaps were found during review:

1. **Umbrella prefixes**: `matchesDynamicPrefix` accepts any dotted prefix (e.g., `repeat.`) extracted from template literals like `` t(`repeat.${freq}`) ``. This hides all keys under that namespace, including dead ones.
2. **Unreachable isTestOnly branch**: In `checkUnused`, `literalKeysTestOnly` is a subset of `literalKeys`, so the `literalKeys.has(baseKey)` check fires first, making the test-only detection dead code. Additionally, fixture strings in the script's own tests (e.g., `"repeat.monthAndDay"`) are picked up by the scanner as real usages.
3. **Disabled integration test**: `i18n-check.project.test.ts` uses `it.skip` with a TODO that references work already completed.

Current state: 7 dead keys survive in locale files undetected.

## Goals / Non-Goals

**Goals:**
- Fix prefix matching to catch dead keys in single-segment namespaces (FR1)
- Make test-only detection work correctly (FR4)
- Compensate with whitelist entries for legitimate enum keys (FR6)
- Remove dead keys and enable the integration gate (FR7-FR9)

**Non-Goals:**
- Redesigning the whitelist DSL or scan architecture (NG1)
- Adding new check kinds beyond existing ones (NG2)

## Decisions

### D1: ">=2 named segments" rule for dotted prefixes

**Decision**: A dotted prefix (ending with `.`) participates in auto-matching only if the part before the trailing dot contains at least one dot itself. `goal.status.` passes (2 segments: `goal`, `status`). `repeat.` fails (1 segment: `repeat`).

**Alternatives considered**:
- (a) >=2 segments rule — **chosen**. Simple, deterministic, covers the gap.
- (b) Full whitelist-only approach — too much manual overhead for safe two-segment prefixes.
- (c) Heuristics (no literals in namespace → prefix valid) — fragile, rejected.

**Rationale**: Single-segment namespaces are the most dangerous umbrellas because they cover an entire namespace. Two-segment prefixes are narrower and less likely to hide unrelated dead keys. Enum values for single-segment namespaces are small, bounded sets — explicit whitelist is appropriate.

### D2: Fix isTestOnly by reordering conditions

**Decision**: Change the condition order in `checkUnused`:
```
if (scan.literalKeys.has(baseKey) && !scan.literalKeysTestOnly.has(baseKey)) continue;
```
This allows the loop to proceed for test-only keys, reaching the `isTestOnly` reporting branch.

**Rationale**: Minimal code change, preserves existing structure, makes the existing branch reachable.

### D3: Synthetic namespace for test fixtures

**Decision**: Rename fixture keys in `src/test/i18n-check/*.test.ts` from real namespaces (e.g., `repeat.monthAndDay`) to a synthetic `fx.` namespace (e.g., `fx.monthAndDay`). The scanner's namespace filter will exclude `fx.*` since it doesn't exist in `en.json`.

**Rationale**: Prevents test fixtures from accidentally masking real dead keys. The `fx.` prefix is short, obviously synthetic, and will never appear in production locales.

### D4: Whitelist entries for single-segment enum namespaces

**Decision**: Add explicit `oneOf` whitelist entries for:
- `theme.` → `[light, dark, system]`
- `color.` → `[blue, coral, green, indigo, orange, purple, yellow]`
- `goalFilter.` → `[all, active, paused, finished]`

The existing `repeat.` whitelist entry already covers `[daily, weekly, monthly, yearly]`. `box.*` keys are all used as literals in `constants/index.ts`, so no whitelist needed.

**Rationale**: These are legitimate runtime-dynamic keys. The whitelist self-validation (FR8 in spec) ensures they stay fresh.

### D5: Semantic fixture isolation instead of blanket namespace ban

**Decision**: The fixture-isolation requirement forbids only fixtures that coincide (after `toBaseKey` normalization) with keys actually present in `en.json`. Fixtures under real namespaces that don't match any live key (e.g., `"repeat.frequency"` after it was deleted) are permitted. An automated test enforces this, with an explicit allow-list for fixtures that must use live keys to verify the real WHITELIST.

**Alternatives considered**:
- (a) Blanket ban on real namespaces in all fixtures — too strict, forces renaming negative-test fixtures like `"repeat.frequency"` which are more readable with realistic names, and breaks whitelist verification tests.
- (b) Semantic isolation via `toBaseKey` collision check — **chosen**. Precisely targets the dangerous case (fixture masking a live key) while allowing harmless realistic fixtures.

**Rationale**: The structural guarantee (after the `checkUnused` fix, test-only keys are reported as unused) means realistic-looking fixtures that don't match live keys cannot cause false negatives. The automated test prevents drift as new keys are added to `en.json`.

## Risks / Trade-offs

- **[Risk] False positives after tightening** — If undiscovered single-segment dynamic namespaces exist in code, they will trigger spurious `unused` errors. → **Mitigation**: Grep for `` `[a-zA-Z]+\.\$\{` `` patterns in `src/` before removing keys. The table of namespaces was verified on the branch.
- **[Risk] Fixture rename breaks tests** — Renaming fixture keys might break test assertions. → **Mitigation**: Update both the fixture strings AND the synthetic locale maps in the same commit; run tests immediately.
- **[Trade-off]** Whitelist grows slightly (3 new entries) — acceptable given they are self-validating and well-commented.
