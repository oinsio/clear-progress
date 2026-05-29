# Tasks: rename-right-panel-to-sidebar

## 1. Split Sidebar into subcomponents (FR5)

- [ ] 1.1 Extract `SidebarSyncBlock` — sync/auth/login button area (expanded + collapsed variants via props)
- [ ] 1.2 Extract `SidebarFilterNav` — filter items navigation list (expanded + collapsed variants via props)
- [ ] 1.3 Rename `RightFilterPanel.tsx` → `Sidebar.tsx`, refactor to use extracted subcomponents (FR1)

## 2. Rename types and hooks (FR2, FR3)

- [ ] 2.1 Rename `RightPanelMode` → `SidebarMode` in `Sidebar.tsx` and all importing files (FR2)
- [ ] 2.2 Rename `useRightPanelNavigation.ts` → `useSidebarNavigation.ts`, update export name and all imports (FR3)

## 3. Update data-testid selectors (FR4)

- [ ] 3.1 Replace `data-testid="right-panel-*"` → `data-testid="sidebar-*"` in `Sidebar.tsx` and subcomponents
- [ ] 3.2 Replace `data-testid="right-filter-*"` → `data-testid="sidebar-filter-*"` in `Sidebar.tsx` and subcomponents

## 4. Update all imports across pages (FR6)

- [ ] 4.1 Update imports in page files: `InboxPage`, `GoalsPage`, `IdeasPage`, `ContextsPage`, `CategoriesPage`, `DeletedPage`, `SearchPage`, `SettingsPage`, `GoalDetailPage`, `CategoryDetailPage`, `ContextDetailPage`
- [ ] 4.2 Update imports in `EntityDetailLayout.tsx` and `MenuOrderSection.tsx`
- [ ] 4.3 Update imports in BDD step files (`goal_focus_navigation.steps.ts`)

## 5. Update test files (FR6, FR7)

- [ ] 5.1 Rename and update `RightFilterPanel.test.tsx` → `Sidebar.test.tsx`, update all testid selectors
- [ ] 5.2 Update `InboxPage.test.tsx` — replace all `right-panel-*` and `right-filter-*` testid references
- [ ] 5.3 Update `GoalDetailPage.test.tsx` and `SettingsPage.test.tsx` — replace testid references
- [ ] 5.4 Update `packages/integration/src/test-helpers.ts` — replace all `right-panel-*` testid selectors (FR7)

## 6. Verification (FR8, M1-M4)

- [ ] 6.1 Run `grep -r "RightFilterPanel\|RightPanelMode\|useRightPanelNavigation" packages/` — expect zero matches (M1)
- [ ] 6.2 Run `grep -r "right-panel-\|right-filter-" packages/` — expect zero matches (M2)
- [ ] 6.3 Run unit tests: `pnpm --filter client run test` — all pass (M3)
- [ ] 6.4 Verify no file in `components/tasks/` exceeds 200 lines (M4)
- [ ] 6.5 Run `pnpm run build` — build succeeds (FR8)
