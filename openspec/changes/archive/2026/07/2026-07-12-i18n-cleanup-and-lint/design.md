## Context

The i18n-check script (`packages/client/scripts/i18n-check/`) already exists and detects `undefined`, `unused`, `parity`, and `override-orphans` errors. It currently reports 121 errors: 6 undefined keys (3 `sync.alert.*` + 3 `*.attachments` prefix issues), ~90 unused keys, and 12 orphan overrides in `house.json`. The script runs locally via `pnpm i18n:check` and as a Vitest test, but is not enforced in CI.

The deployment workflow (`.github/workflows/deploy.yml`) only builds — no tests, linting, or i18n checks. The QA workflow (`deploy-qa.yml`) is similar.

## Goals / Non-Goals

**Goals:**
- Fix the `sync.alert.*` bug (FR1-FR3) — highest priority, user-facing
- Clean up dead keys so `i18n:check` passes clean (FR4-FR5)
- Gate CI on `i18n:check` (FR8) to prevent regression

**Non-Goals:**
- Changing the i18n-check script logic (it works correctly)
- Deduplicating shared values (separate change)
- Adding TypeScript type safety for `t()` calls

## Decisions

### D1: Translation text for `sync.alert.*` keys

Derive from the existing (now-unused) predecessor keys rather than inventing new copy:
- `sync.alert.repeat_rule_reset` — based on `sync.repeatRuleCorrupted` + `sync.repeatRuleCorruptedAdvice`
- `sync.alert.name_set_untitled` — based on `sync.nameUntitled` + `sync.nameUntitledAdvice`
- `sync.alert.checklist_item_deleted` — based on `sync.checklistOrphaned` + `sync.checklistOrphanedAdvice`

Each key combines the "what happened" and "what to do" into a single message, since `AlertOverlay` renders `t(alert.messageKey)` as a single `<p>` element — there's no separate advice field in the `SyncAlert` type.

### D2: Whitelist update for `sync.alert.*`

These keys are referenced via `messageKey` variable in `healingRules.ts`, not via literal `t()` calls. The scanner doesn't see them as used. Add a whitelist entry `^sync\.alert\.` with reason pointing to `healingRules.ts`.

### D3: Order of operations

1. Add `sync.alert.*` keys first (fix the bug)
2. Update whitelist (so new keys don't show as unused)
3. Update test fixtures that use dead keys
4. Delete unused keys (bulk cleanup)
5. Delete orphan overrides from `house.json`
6. Add `i18n:check` to CI

This order ensures the bug fix lands first and the i18n-check script validates each subsequent step.

### D4: CI integration approach

Add a `check` job to `deploy.yml` that runs before `build`:
- `pnpm i18n:check` (the CLI script, exits non-zero on errors)

This is simpler than adding a separate workflow file. The existing Vitest test for i18n-check also runs if tests are added to CI later.

### D5: Verification of unused keys before deletion

Before deleting each group, re-verify with `grep -rn` across `src/` (including `.feature` files and tests) to guard against false positives from the scanner. Keys used only in tests should be replaced with valid keys, not kept as dead locale entries.

## Risks / Trade-offs

- **[False unused]** A key could be used via a dynamic pattern the scanner doesn't detect → Mitigated by re-grep before deletion and running all tests after each group removal
- **[house.json sync]** Deleting keys from base locales requires mirroring in `house.json` → The `override-orphans` check catches any missed keys
- **[Test fixture breakage]** Tests using dead keys as fixtures will fail after key removal → Update fixtures before or alongside key deletion
