## 1. Sidebar mode preference and state resolution (FR1, FR8)

- [x] 1.1 Add `SidebarMode` type (`'expanded' | 'collapsed' | 'expand-on-hover'`) to `types/common.ts`
- [x] 1.2 Add constants: `SIDEBAR_MODES` array, `STORAGE_KEYS.SIDEBAR_MODE`, `SIDEBAR_HOVER_OPEN_DELAY_MS = 250`, `SIDEBAR_HOVER_CLOSE_DELAY_MS = 150` in `constants/index.ts`
- [x] 1.3 Create `useHoverCapability` hook — wraps `window.matchMedia('(hover: hover)')` with change listener, returns `hasHover: boolean`
- [x] 1.4 Create `useSidebarMode` hook — reads/writes `SIDEBAR_MODE` from localStorage via `usePreference`. Migration: if `SIDEBAR_MODE` absent, read `PANEL_OPEN` (`"true"` → `"expanded"`, `"false"` → `"collapsed"`), remove `PANEL_OPEN`
- [x] 1.5 Create `resolveSidebarState` pure function — inputs: `isNarrow`, `hasHover`, `sidebarMode` → returns effective state (`'expanded' | 'collapsed' | 'hover-ready'`). Implements the 12-cell matrix from proposal.
- [x] 1.6 Create `useSidebarState` hook — combines `useIsDesktop` (inverted as `isNarrow`), `useHoverCapability`, `useSidebarMode` → calls `resolveSidebarState` → returns `{ effectiveState, sidebarMode, setSidebarMode, isNarrow, hasHover }`
- [x] 1.7 Unit tests for `resolveSidebarState`: `it.each` for all 12 matrix combinations
- [x] 1.8 Unit tests for `useHoverCapability`: matchMedia mock, change event
- [x] 1.9 Unit tests for `useSidebarMode`: default value, migration from `PANEL_OPEN`, persistence
- [x] 1.10 Unit tests for `useSidebarState`: integration of three factors
- [x] 1.11 BDD: Create `sidebar_state_matrix.feature` with scenarios for all matrix combinations, tagged `@improve-sidebar-ux @FR8`
- [x] 1.12 Verify build: `pnpm run build`

## 2. Remove toggle buttons and refactor Sidebar props (FR4)

- [x] 2.1 Remove toggle button (`ChevronLeft`/`ChevronRight`, `sidebar-toggle-button`) from `SidebarSyncBlock.tsx` — remove `onToggle` prop, remove chevron imports
- [x] 2.2 Update `Sidebar.tsx` props: remove `onToggle`, `onCollapsedClick`, `isOpen` boolean → replace with `effectiveState: 'expanded' | 'collapsed' | 'hover-ready'` and `isDrawerOpen: boolean` (for mobile drawer)
- [x] 2.3 Remove backdrop from `Sidebar.tsx` expanded branch (will be in `TaskPageLayout` scoped to narrow + no hover)
- [x] 2.4 Update collapsed sidebar container: remove `onClick={onCollapsedClick ?? onToggle}`, `cursor-pointer`, `role="button"`, `tabIndex`, `onKeyDown`. Navigation icons handle their own clicks.
- [x] 2.5 Update `SidebarFilterNav.tsx`: remove `onAutoCollapse` from expanded mode. In collapsed mode, each icon click directly navigates (already does).
- [x] 2.6 Update tests: `Sidebar.test.tsx`, `Sidebar.css.test.tsx`, `Sidebar.logic.test.tsx`, `SidebarSyncBlock.css.test.tsx`, `SidebarSyncBlock.logic.test.tsx` for new props
- [x] 2.7 BDD: Update `sidebar_toggle.feature` — remove toggle button scenarios, update to new mode system
- [x] 2.8 Verify build: `pnpm run build`

## 3. Hover expand behavior (FR5, FR6, NFR-R3)

- [x] 3.1 Create `useSidebarHover` hook — `mouseenter`/`mouseleave` on sidebar ref with debounced open/close timers (`SIDEBAR_HOVER_OPEN_DELAY_MS`, `SIDEBAR_HOVER_CLOSE_DELAY_MS`). Returns `{ isHoverExpanded: boolean, hoverHandlers: { onMouseEnter, onMouseLeave } }`. Active only when `effectiveState === 'hover-ready'`.
- [x] 3.2 Update `Sidebar.tsx`: when `effectiveState === 'hover-ready'` and `isHoverExpanded === true`, render expanded variant as overlay (absolute/fixed positioning, higher z-index, no content push)
- [x] 3.3 When `effectiveState === 'hover-ready'` and `isHoverExpanded === false`, render collapsed variant
- [x] 3.4 In hover-expanded mode, navigation click navigates but does NOT collapse sidebar (cursor still inside)
- [x] 3.5 Unit tests for `useSidebarHover`: debounce timing, mouseenter/mouseleave, active only when hover-ready
- [x] 3.6 BDD: Create `sidebar_hover.feature` — hover opens overlay, cursor leave closes, debounce prevents flicker, nav click keeps sidebar open. Tagged `@improve-sidebar-ux @FR5 @FR6`
- [x] 3.7 Verify build: `pnpm run build`

## 4. Sidebar control popover (FR2, NFR-A1, NFR-A2)

- [x] 4.1 Create `SidebarControlPopover.tsx` — popover with three radio-style options (Expanded, Collapsed, Expand on hover). Active mode indicated visually. Accepts `currentMode`, `onModeChange` props.
- [x] 4.2 Add popover trigger button to `SidebarFilterNav.tsx` bottom area (above search, above divider): `PanelLeft` icon when `side === 'left'`, `PanelRight` when `side === 'right'`. Hidden when `isNarrow && !hasHover` (FR18).
- [x] 4.3 Add `aria-label` to trigger button, keyboard navigation in popover (arrow keys, Enter, Escape) (NFR-A1, NFR-A2)
- [x] 4.4 Add i18n keys: `sidebar.control`, `sidebar.modeExpanded`, `sidebar.modeCollapsed`, `sidebar.modeExpandOnHover` to `ru.json` and `en.json`
- [x] 4.5 Unit tests for `SidebarControlPopover`: renders three options, active state, click changes mode, keyboard navigation, hidden on mobile
- [x] 4.6 BDD: Create `sidebar_control.feature` — popover opens, mode switch, sync with settings. Tagged `@improve-sidebar-ux @FR2`
- [x] 4.7 Verify build: `pnpm run build`

## 5. Integrate into TaskPageLayout (FR8, FR14-FR17)

- [x] 5.1 Refactor `TaskPageLayout.tsx`: replace `usePanelOpen` with `useSidebarState`. Pass `effectiveState` and `isHoverExpanded` to `Sidebar`.
- [x] 5.2 Drawer state for mobile: add `isDrawerOpen` local state. Swipe opens drawer (`setIsDrawerOpen(true)`), backdrop/nav click closes it (`setIsDrawerOpen(false)`).
- [x] 5.3 Backdrop rendering: only when `isNarrow && !hasHover && isDrawerOpen`. Move backdrop from `Sidebar.tsx` to `TaskPageLayout.tsx`.
- [x] 5.4 Pass `isDrawerOpen` to `Sidebar` for mobile drawer rendering.
- [x] 5.5 Resize transitions (FR14-FR17): `useSidebarState` recalculates `effectiveState` reactively. When transitioning to narrow: if drawer was not explicitly opened, it stays closed. When transitioning to wide: close drawer, apply saved setting.
- [x] 5.6 Update `useSidebarSwipe` guards: `isNarrow && !hasHover` instead of `!isDesktop`. Update `onOpen`/`onClose` to use drawer state.
- [x] 5.7 Auto-collapse on navigation in drawer mode (FR11): `SidebarFilterNav` calls `onAutoCollapse` only when `isDrawerOpen` is true.
- [x] 5.8 Update `TaskPageLayout.test.tsx` for new integration
- [x] 5.9 BDD: Create `sidebar_resize.feature` — resize transitions for all combinations. Tagged `@improve-sidebar-ux @FR14 @FR15 @FR16 @FR17`
- [x] 5.10 Verify build: `pnpm run build`

## 6. Mobile behavior — collapsed navigation and drawer (FR9, FR10, FR11, FR12, FR13)

- [x] 6.1 On narrow + no hover: collapsed sidebar icons navigate directly on tap (FR10) — already works via `SidebarFilterNav` collapsed mode
- [x] 6.2 Swipe opens drawer with backdrop (FR13) — update `useSidebarSwipe` to use new drawer state
- [x] 6.3 Backdrop tap closes drawer (FR12) — already in TaskPageLayout from task 5.3
- [x] 6.4 Drawer auto-collapse on nav click (FR11) — already from task 5.7
- [x] 6.5 Sidebar control popover hidden on narrow + no hover (FR18) — already from task 4.2
- [x] 6.6 BDD: Update `sidebar_backdrop.feature` — scoped to narrow + no hover. Tagged `@improve-sidebar-ux @FR12`
- [x] 6.7 BDD: Update `sidebar_swipe.feature` — scoped to narrow + no hover. Tagged `@improve-sidebar-ux @FR13`
- [x] 6.8 BDD: Update `sidebar_modal.feature` — drawer auto-collapse. Tagged `@improve-sidebar-ux @FR11`
- [x] 6.9 Verify build: `pnpm run build`

## 7. Settings page — sidebar control (FR3)

- [x] 7.1 Add sidebar mode selector to `WorkspaceSection.tsx` — same three options as popover, using `useSidebarMode` hook
- [x] 7.2 Ensure sync: both popover and settings read/write the same `SIDEBAR_MODE` localStorage key via `useSidebarMode`
- [x] 7.3 Add i18n keys for settings labels if not covered by task 4.4
- [x] 7.4 Unit tests: `WorkspaceSection.test.tsx` — sidebar mode selector renders, changes mode, syncs with localStorage
- [x] 7.5 Verify build: `pnpm run build`

## 8. Cleanup legacy code

- [x] 8.1 Remove `isTemporarilyOpen`, `openTemporarily`, `closeTemporary` from `usePanelOpen.ts` (replaced by drawer state + hover state)
- [x] 8.2 Remove `DESKTOP_PANEL_OPEN_DEFAULT`, `MOBILE_PANEL_OPEN_DEFAULT` from constants (replaced by sidebar mode)
- [x] 8.3 Remove `STORAGE_KEYS.PANEL_OPEN` after migration logic is in `useSidebarMode`
- [x] 8.4 Update `usePanelOpen.migration.test.ts` — migration now in `useSidebarMode`
- [x] 8.5 Clean up unused imports across all changed files
- [x] 8.6 Verify build: `pnpm run build`

## 9. BDD defaults and existing feature updates

- [x] 9.1 Update `sidebar_defaults.feature` — default is `expanded` on desktop, sidebar control not applicable on mobile
- [x] 9.2 Update `sidebar_mode.feature` — replace old mode scenarios with new three-mode system
- [x] 9.3 Update all sidebar BDD step files for new hook APIs and props
- [x] 9.4 Verify all sidebar BDD features pass: `npx vitest run --reporter=verbose src/test/features/sidebar/`

## 10. Mutation testing

- [x] 10.1 Mutation testing on `resolveSidebarState.ts` (scoped)
- [x] 10.2 Mutation testing on `useSidebarMode.ts`, `useHoverCapability.ts` (scoped, max 3 files)
- [x] 10.3 Mutation testing on `useSidebarHover.ts` (scoped)
- [x] 10.4 Mutation testing on `SidebarControlPopover.tsx` (scoped)
- [x] 10.5 Mutation testing on `Sidebar.tsx`, `SidebarSyncBlock.tsx` (scoped)
- [x] 10.6 Target >= 95% mutation score on all new/modified files

## 11. Final verification

- [x] 11.1 Verify build: `pnpm run build`
- [x] 11.2 Run full BDD sidebar suite: all sidebar feature files pass
- [x] 11.3 Run existing page tests (InboxPage, GoalsPage, etc.) — verify no regressions
- [x] 11.4 Run settings page tests — verify no regressions
- [x] 11.5 Check JetBrains IDE diagnostics on all changed files
