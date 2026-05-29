# Tasks: add-sidebar-specs

Assumes `rename-right-panel-to-sidebar` is completed first.

## 1. Create sidebar-navigation capability spec (FR1)

- [x] 1.1 Create `openspec/specs/sidebar-navigation/spec.md` with all requirements from the delta spec

## 2. Move sidebar requirement from app-shell-navigation (FR7)

- [x] 2.1 Apply delta spec: remove "Sidebar login button navigates to Settings" from `openspec/specs/app-shell-navigation/spec.md`

## 3. BDD feature files (FR2-FR5)

- [x] 3.1 Create `features/sidebar/sidebar_toggle.feature` — toggle open/close, always-open override, collapsed strip rendering (@add-sidebar-specs @FR2)
- [x] 3.2 Create `features/sidebar/sidebar_mode.feature` — mode selection, route navigation, toggle off active mode (@add-sidebar-specs @FR3)
- [x] 3.3 Create `features/sidebar/sidebar_side.feature` — left/right layout, border direction, element order (@add-sidebar-specs @FR4)
- [x] 3.4 Create `features/sidebar/sidebar_sync.feature` — synced, syncing, offline, error, not_configured, unauthorized (@add-sidebar-specs @FR5)

## 4. BDD step definitions (FR6)

- [x] 4.1 Create `features/sidebar/steps/sidebar_toggle.steps.ts` — step definitions for toggle scenarios
- [x] 4.2 Create `features/sidebar/steps/sidebar_mode.steps.ts` — step definitions for mode switching scenarios
- [x] 4.3 Create `features/sidebar/steps/sidebar_side.steps.tsx` — step definitions for side placement scenarios
- [x] 4.4 Create `features/sidebar/steps/sidebar_sync.steps.tsx` — step definitions for sync status scenarios

## 5. Verification (M1-M4)

- [x] 5.1 Run BDD unit tests: `pnpm --filter client test -- --testPathPattern sidebar` — all pass (M2)
- [x] 5.2 Verify `sidebar-navigation/spec.md` has >= 10 requirements (M1)
- [ ] 5.3 Run `pnpm run lint:fix` and fix issues
- [ ] 5.4 Run mutation testing on sidebar components — score >= 95% (M3). Command: `npx stryker run --mutate 'packages/client/src/components/tasks/Sidebar.tsx,packages/client/src/components/tasks/SidebarSyncBlock.tsx,packages/client/src/components/tasks/SidebarFilterNav.tsx,packages/client/src/hooks/useSidebarNavigation.ts'`
- [ ] 5.5 Run `pnpm run build` — build succeeds
