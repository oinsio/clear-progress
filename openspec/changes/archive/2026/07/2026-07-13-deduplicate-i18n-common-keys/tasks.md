## 1. Preparation (FR6)

- [x] 1.1 Update `ContextDetailPage` and `CategoryDetailPage` to pass `"common.saveName"` instead of `"context.saveName"` / `"category.saveName"` via `i18nKeys.saveName` (confirmed alive — used dynamically in `EntityDetailLayout`)

## 2. Add `common` namespace to locale files (FR1, FR2)

- [x] 2.1 Add `common` section to `en.json` with keys: cancel, back, delete, close, next, save, loading, name, taskCount, details, attachments (and saveName if not dead)
- [x] 2.2 Add matching `common` section to `ru.json`
- [x] 2.3 Remove the ~35 domain-specific keys replaced by `common.*` from `en.json`
- [x] 2.4 Remove the matching domain-specific keys from `ru.json`

## 3. Update component references (FR3)

- [x] 3.1 Update cancel-related `t()` calls in ~13 components to use `common.cancel`
- [x] 3.2 Update back-related `t()` calls in ~6 components to use `common.back`
- [x] 3.3 Update delete-related `t()` calls in ~5 components to use `common.delete`
- [x] 3.4 Update close-related `t()` calls in ~5 components to use `common.close`
- [x] 3.5 Update next-related `t()` calls in ~3 components to use `common.next`
- [x] 3.6 Update save-related `t()` calls in ~2 components to use `common.save`
- [x] 3.7 Update loading-related `t()` calls in ~4 components to use `common.loading`
- [x] 3.8 Update name/taskCount/details/attachments `t()` calls in ~5 components to use `common.*`

## 4. Extend i18n-check whitelist (FR4, FR5)

- [x] 4.1 Add duplicate whitelist data structure and filtering logic to `whitelist.ts` and `duplicates.ts` — groups where all keys match a duplicate-whitelist pattern are suppressed from output
- [x] 4.2 Add domain navigation term patterns to duplicate whitelist (inbox, today, later, all, yesterday, tasks, goals, ideas, contexts, categories, memos, deleted)
- [x] 4.3 Add semantic pair patterns to duplicate whitelist (settings.name/settingsAriaLabel, login/loginAriaLabel, pin/unpin, syncIndicator/syncLegend, connectSupabase/typeSupabase, disconnectConfirm/disconnect, status.paused/goalFilter.paused)
- [x] 4.4 Add `common` to the i18n-check scanner's namespace list so `common.*` keys are recognized in source code
- [x] 4.5 Add duplicate whitelist self-validation — stale patterns trigger errors (consistent with existing FR8)

## 5. Verification (FR7, M1–M4)

- [x] 5.1 Run `pnpm run i18n:check` — verify 0 duplicate groups and 0 errors (3 pre-existing undefined-key errors remain, not from this change)
- [x] 5.2 Run existing i18n BDD tests — verify all pass (73/73)
- [x] 5.3 Run i18n-check unit tests — verify all pass (79/80 pass; 1 project-consistency test fails due to 3 pre-existing undefined keys, not from this change)
- [x] 5.4 Run `pnpm run build` — verify build succeeds
