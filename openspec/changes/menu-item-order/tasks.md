## 1. Update default order constant (FR1, FR2)

- [ ] 1.1 Update `DEFAULT_MENU_MODE_ORDER` in `packages/client/src/stores/menuOrderStore.ts` to new order: inbox, contexts, categories, ideas, goals, tasks, completed, memos, deleted, focused_goals
- [ ] 1.2 Verify `DEFAULT_MENU_ORDER` logic still correctly marks `deleted` as `visible: false` (no code change expected, just verify)

## 2. Update tests (FR1)

- [ ] 2.1 Update expected order in `packages/client/src/stores/menuOrderStore.getSnapshot.test.ts` (line 16-27)
- [ ] 2.2 Update expected order in `packages/client/src/hooks/useMenuOrder.defaults.test.ts` (line 14-26)

## 3. Verification

- [ ] 3.1 Run unit tests: `npx vitest run menuOrderStore` and `npx vitest run useMenuOrder`
- [ ] 3.2 Run build: `pnpm run build`
