## 1. BDD Specification

- [ ] 1.1 Create feature file `menu_order_reactivity.feature` with Gherkin scenarios for cross-instance reactivity (FR1)
- [ ] 1.2 Create step definitions `menu_order_reactivity.steps.ts` — tests should fail (RED)

## 2. External Store

- [ ] 2.1 Create `stores/menuOrderStore.ts` — move `loadMenuOrder`, `DEFAULT_MENU_ORDER`, `DEFAULT_MENU_MODE_ORDER` from `useMenuOrder.ts`
- [ ] 2.2 Implement `getSnapshot()`, `subscribe()`, `setMenuOrder()`, `_resetForTesting()`
- [ ] 2.3 Create unit tests `stores/menuOrderStore.test.ts` — persistence, validation, migration, subscribers, referential stability

## 3. Hook

- [ ] 3.1 Rewrite `hooks/useMenuOrder.ts` — thin wrapper via `useSyncExternalStore`
- [ ] 3.2 Update `hooks/useMenuOrder.test.ts` — adapt existing tests, add cross-instance test
- [ ] 3.3 Verify that BDD step definitions pass (GREEN)

## 4. Cleanup

- [ ] 4.1 Remove `MENU_ORDER_CHANGED_EVENT` from `constants/index.ts`

## 5. Verification

- [ ] 5.1 All BDD scenarios are green
- [ ] 5.2 All unit tests are green
- [ ] 5.3 Existing `useMenuOrder.test.ts` tests are not broken
- [ ] 5.4 `pnpm run build` without errors
- [ ] 5.5 JetBrains MCP diagnostics for changed files
- [ ] 5.6 Mutation testing >= 95%
