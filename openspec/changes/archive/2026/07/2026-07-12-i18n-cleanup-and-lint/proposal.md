# i18n-cleanup-and-lint

## Why

The push self-healing system (`healingRules.ts`) references three i18n keys (`sync.alert.repeat_rule_reset`, `sync.alert.name_set_untitled`, `sync.alert.checklist_item_deleted`) that do not exist in any locale file. When self-healing triggers, users see raw keys instead of human-readable messages in the AlertOverlay. Additionally, static analysis found ~90 unused keys accumulated across `en.json`/`ru.json` and 12 orphan overrides in `house.json`, producing 121 errors from the existing `i18n:check` script. The i18n-check gate is not yet enforced in CI, so locale drift keeps accumulating.

## What Changes

- **ADDED**: Three missing `sync.alert.*` translation keys in `en.json`, `ru.json`, and optionally `house.json` — fixes the broken self-healing alerts
- **REMOVED**: ~90 unused keys from `en.json`/`ru.json` and ~12 orphan overrides from `house.json`
- **MODIFIED**: i18n-check whitelist to cover `sync.alert.*` keys (used via `messageKey` pattern, not literal `t()` calls)
- **MODIFIED**: CI workflow to run `i18n:check` as a gate, preventing future locale drift
- **MODIFIED**: Tests that use dead keys as fixtures (`AlertOverlay.test.tsx`, `AlertProvider.test.tsx`) — update to use valid keys

## Goals

- **G1**: Zero `undefined` errors from `i18n:check` — all keys referenced in production code exist in locale files
- **G2**: Zero `unused` errors — no dead keys in locale files
- **G3**: Zero `override-orphans` errors — `house.json` only overrides keys that exist in `ru.json`
- **G4**: CI enforcement — locale drift detected and blocked before merge

## Non-Goals

- **NG1**: Deduplicating keys with identical values (e.g., "Cancel" x13) — separate change `i18n-dedupe-common-keys`
- **NG2**: Adding TypeScript type safety for `t()` calls (e.g., `i18next-cli types`) — separate initiative
- **NG3**: Changing the i18n-check script's core logic — it already works, just needs whitelist update and CI integration

## Users & Scenarios

- **U1**: User triggers push self-healing (e.g., corrupted repeat rule) — sees a localized, understandable alert message instead of a raw key
- **U2**: Developer adds a new i18n key — CI catches if the key is missing from any required locale
- **U3**: Developer removes a feature — CI catches if orphan keys are left behind

## Requirements

### Functional

- **FR1**: Add `sync.alert.repeat_rule_reset` key to `en.json` and `ru.json` with text describing that a corrupted repeat rule was reset
- **FR2**: Add `sync.alert.name_set_untitled` key to `en.json` and `ru.json` with text describing that a missing name was set to "(untitled)"
- **FR3**: Add `sync.alert.checklist_item_deleted` key to `en.json` and `ru.json` with text describing that a checklist item was deleted because its parent task couldn't sync
- **FR4**: Remove all keys reported as `unused` by `i18n:check` from `en.json` and `ru.json` (full list in section below)
- **FR5**: Remove all keys reported as `override-orphans` from `house.json`
- **FR6**: Add `sync.alert.*` pattern to the i18n-check whitelist (these keys are referenced via `messageKey` variable, not literal `t()` calls)
- **FR7**: Update test fixtures in `AlertOverlay.test.tsx` and `AlertProvider.test.tsx` that reference dead keys to use valid keys
- **FR8**: Add `i18n:check` step to CI workflow so locale errors block merge

### Unused keys to remove (FR4)

From `en.json` and `ru.json`:
- `auth.*`: `accountSection`, `errorSignIn`, `sessionExpired`, `signInRequired`, `signOutButton`, `signedInAs`
- `category.*`: `add`, `addTask`, `nameLabel`, `namePlaceholder`, `taskPlaceholder`
- `context.*`: `add`, `addTask`, `nameLabel`, `namePlaceholder`, `taskPlaceholder`
- `deleted.*`: `purgeSuccess`, `restore`
- `filter.*`: `close`, `showHidden`
- `goal.*`: `add`, `addTask`, `close`, `collapseDescription`, `expandDescription`, `taskPlaceholder`, `cover.closeLightbox`, `cover.uploadError`
- `goal.attachments.*`: `empty`, `confirmDelete`, `confirmDeleteMessage`, `confirmDeleteButton`
- `idea.*`: `add`, `addTask`, `cancel`, `cancelLabel`, `delete`, `editName`, `save`, `saveLabel`, `taskPlaceholder`
- `idea.attachments.*`: `empty`, `confirmDelete`, `confirmDeleteMessage`, `confirmDeleteButton`
- `nav.*`: entire block (`inbox`, `today`, `tasks`, `goals`, `ideas`, `search`, `ariaLabel`)
- `pwa.*`: `appUpdated`, `ok`
- `settings.*`: `detailPanelPinned`, `focusStronger`, `focusWeaker`, `fullSync`, `panelAlwaysOpen`, `syncConfigure`, `syncConnect`, `syncConnected`, `syncDisconnect`, `syncNoAuth`, `syncNotConnected`, `syncSection`, `server.initError`, `server.initializing`, `server.timeoutError`
- `share.button`
- `sync.*`: `checklistOrphaned`, `checklistOrphanedAdvice`, `fkCleared`, `fkClearedAdvice`, `nameUntitled`, `nameUntitledAdvice`, `rejectedBox`, `rejectedBoxAdvice`, `rejectedCorrupted`, `rejectedCorruptedAdvice`, `rejectedEntityType`, `rejectedEntityTypeAdvice`, `rejectedStatus`, `rejectedStatusAdvice`, `repeatRuleCorrupted`, `repeatRuleCorruptedAdvice`, `unauthorized`
- `task.*`: `add`, `addPlaceholder`, `create`, `createLabel`, `newName`, `searchPlaceholder`
- `task.attachments.*`: `confirmDelete`, `confirmDeleteMessage`, `confirmDeleteButton`
- `taskDetail.*`: `empty`, `emptyHint`
- `taskEdit.*`: `cancel`, `cancelLabel`, `close`, `deleteLabel`, `name`, `save`, `saveLabel`

### Non-Functional

#### Reliability — NFR-R1
After cleanup, `pnpm i18n:check` exits with code 0 (zero errors).

## UX Acceptance Criteria

- **UX1**: When self-healing resets a repeat rule, the AlertOverlay shows a human-readable message in the user's language explaining what happened
- **UX2**: When self-healing sets a name to "(untitled)", the AlertOverlay explains why
- **UX3**: When self-healing deletes a checklist item, the AlertOverlay explains why

## Behavior

No new Gherkin features required. Existing `i18n-check` tests and `AlertOverlay` tests will be updated.

## Visual Reference

No visual changes — alert overlay design unchanged, only translation content changes.

## Affected IA

No changes.

## Success Metrics

- **M1**: `pnpm i18n:check` reports 0 errors (currently 121)
- **M2**: CI blocks PRs that introduce locale drift
- **M3**: All three `sync.alert.*` message keys render localized text in AlertOverlay

## Open Questions

None. `house.json` styled overrides for `sync.alert.*` are deferred — `house.json` will be fully rewritten in a separate change.
