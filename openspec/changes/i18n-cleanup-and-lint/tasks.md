## 1. Fix sync.alert.* bug (FR1, FR2, FR3)

- [ ] 1.1 Add `sync.alert.repeat_rule_reset` key to `en.json` and `ru.json` — text derived from existing `sync.repeatRuleCorrupted` + `sync.repeatRuleCorruptedAdvice`, combined into one message
- [ ] 1.2 Add `sync.alert.name_set_untitled` key to `en.json` and `ru.json` — text derived from `sync.nameUntitled` + `sync.nameUntitledAdvice`
- [ ] 1.3 Add `sync.alert.checklist_item_deleted` key to `en.json` and `ru.json` — text derived from `sync.checklistOrphaned` + `sync.checklistOrphanedAdvice`
- [ ] 1.4 Add `sync.alert.*` whitelist entry to `scripts/i18n-check/whitelist.ts` with reason pointing to `healingRules.ts` (FR6)
- [ ] 1.5 Verify: `pnpm i18n:check` reports 0 `undefined` errors

## 2. Update test fixtures (FR7)

- [ ] 2.1 Update `AlertOverlay.test.tsx` — replace any fixtures using dead keys (`sync.fkCleared`, `sync.nameUntitled`, etc.) with valid `sync.alert.*` keys
- [ ] 2.2 Update `AlertProvider.test.tsx` — replace fixtures using `sync.error`/`sync.conflict` or other dead keys with valid existing keys
- [ ] 2.3 Verify: `pnpm vitest run src/components/alerts` and `pnpm vitest run src/app/providers/AlertProvider` pass

## 3. Remove unused keys from en.json and ru.json (FR4)

- [ ] 3.1 Remove `auth.*` dead keys: `accountSection`, `errorSignIn`, `sessionExpired`, `signInRequired`, `signOutButton`, `signedInAs`
- [ ] 3.2 Remove `nav.*` entire block: `inbox`, `today`, `tasks`, `goals`, `ideas`, `search`, `ariaLabel`
- [ ] 3.3 Remove `category.*` dead keys: `add`, `addTask`, `nameLabel`, `namePlaceholder`, `taskPlaceholder`
- [ ] 3.4 Remove `context.*` dead keys: `add`, `addTask`, `nameLabel`, `namePlaceholder`, `taskPlaceholder`
- [ ] 3.5 Remove `goal.*` dead keys: `add`, `addTask`, `close`, `collapseDescription`, `expandDescription`, `taskPlaceholder`, `cover.closeLightbox`, `cover.uploadError`, `attachments.empty`, `attachments.confirmDelete`, `attachments.confirmDeleteMessage`, `attachments.confirmDeleteButton`
- [ ] 3.6 Remove `idea.*` dead keys: `add`, `addTask`, `cancel`, `cancelLabel`, `delete`, `editName`, `save`, `saveLabel`, `taskPlaceholder`, `attachments.empty`, `attachments.confirmDelete`, `attachments.confirmDeleteMessage`, `attachments.confirmDeleteButton`
- [ ] 3.7 Remove `task.*` dead keys: `add`, `addPlaceholder`, `create`, `createLabel`, `newName`, `searchPlaceholder`, `attachments.confirmDelete`, `attachments.confirmDeleteMessage`, `attachments.confirmDeleteButton`
- [ ] 3.8 Remove `taskEdit.*` dead keys: `cancel`, `cancelLabel`, `close`, `deleteLabel`, `name`, `save`, `saveLabel`
- [ ] 3.9 Remove `taskDetail.*` dead keys: `empty`, `emptyHint`
- [ ] 3.10 Remove `settings.*` dead keys: `detailPanelPinned`, `focusStronger`, `focusWeaker`, `fullSync`, `panelAlwaysOpen`, `syncConfigure`, `syncConnect`, `syncConnected`, `syncDisconnect`, `syncNoAuth`, `syncNotConnected`, `syncSection`, `server.initError`, `server.initializing`, `server.timeoutError`
- [ ] 3.11 Remove `sync.*` dead keys: `unauthorized`, `fkCleared`, `fkClearedAdvice`, `checklistOrphaned`, `checklistOrphanedAdvice`, `nameUntitled`, `nameUntitledAdvice`, `repeatRuleCorrupted`, `repeatRuleCorruptedAdvice`, `rejectedBox`, `rejectedBoxAdvice`, `rejectedCorrupted`, `rejectedCorruptedAdvice`, `rejectedEntityType`, `rejectedEntityTypeAdvice`, `rejectedStatus`, `rejectedStatusAdvice`
- [ ] 3.12 Remove remaining dead keys: `deleted.restore`, `deleted.purgeSuccess`, `filter.close`, `filter.showHidden`, `share.button`, `pwa.appUpdated`, `pwa.ok`
- [ ] 3.13 Verify: `pnpm i18n:check` reports 0 `unused` errors

## 4. Remove orphan overrides from house.json (FR5)

- [ ] 4.1 Remove orphan keys: `goal.newName`, `goal.create`, `repeat.intervalLabel`, `repeat.day1`–`repeat.day7`, `repeat.applyWeekly`, `repeat.applyInterval`
- [ ] 4.2 Remove any keys from `house.json` that were deleted from `ru.json` in phase 3 (if overrides exist)
- [ ] 4.3 Verify: `pnpm i18n:check` reports 0 `override-orphans` errors

## 5. CI integration (FR8)

- [ ] 5.1 Add `i18n:check` step to `.github/workflows/deploy.yml` before the build step
- [ ] 5.2 Add `i18n:check` step to `.github/workflows/deploy-qa.yml` before the build step

## 6. Final verification (NFR-R1)

- [ ] 6.1 Run `pnpm i18n:check` — must report 0 errors (M1)
- [ ] 6.2 Run `pnpm test` — all tests pass
- [ ] 6.3 Run `pnpm build` — build succeeds
