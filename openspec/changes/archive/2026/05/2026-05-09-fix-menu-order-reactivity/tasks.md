## 1. BDD Specification

- [x] 1.1 Create feature file `menu_order_reactivity.feature` with Gherkin scenarios for cross-instance reactivity (FR1)
- [x] 1.2 Create step definitions `menu_order_reactivity.steps.ts` — tests should fail (RED)

## 2. External Store

- [x] 2.1 Create `stores/menuOrderStore.ts` — move `loadMenuOrder`, `DEFAULT_MENU_ORDER`, `DEFAULT_MENU_MODE_ORDER` from `useMenuOrder.ts`
- [x] 2.2 Implement `getSnapshot()`, `subscribe()`, `setMenuOrder()`, `_resetForTesting()`
- [x] 2.3 Create unit tests `stores/menuOrderStore.test.ts` — persistence, validation, migration, subscribers, referential stability

## 3. Hook

- [x] 3.1 Rewrite `hooks/useMenuOrder.ts` — thin wrapper via `useSyncExternalStore`
- [x] 3.2 Update `hooks/useMenuOrder.test.ts` — adapt existing tests, add cross-instance test
- [x] 3.3 Verify that BDD step definitions pass (GREEN)

## 4. Cleanup

- [x] 4.1 Remove `MENU_ORDER_CHANGED_EVENT` from `constants/index.ts`

## 5. Verification

- [x] 5.1 All BDD scenarios are green
- [x] 5.2 All unit tests are green
- [x] 5.3 Existing `useMenuOrder.test.ts` tests are not broken
- [x] 5.4 `pnpm run build` without errors
- [x] 5.5 JetBrains MCP diagnostics for changed files
- [x] 5.6 Mutation testing >= 95%
