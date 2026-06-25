## 1. Remove always-open feature (FR10)

- [x] 1.1 Add migration logic in `usePanelOpen`: if `PANEL_ALWAYS_OPEN` is `"true"` in localStorage, set `PANEL_OPEN` to `"true"` and remove `PANEL_ALWAYS_OPEN` key
- [x] 1.2 Remove `usePanelAlwaysOpen` hook, remove always-open state from `PanelSettingsProvider`
- [x] 1.3 Remove `PANEL_ALWAYS_OPEN` from `STORAGE_KEYS` in `constants/index.ts`
- [x] 1.4 Remove always-open toggle from `WorkspaceSection.tsx` settings UI
- [x] 1.5 Remove always-open logic from `Sidebar.tsx` (`isPanelAlwaysOpen` usage, `effectiveIsOpen`)
- [x] 1.6 Update all tests referencing `usePanelAlwaysOpen` / `isPanelAlwaysOpen` (sidebar toggle, mode, side, sync BDD steps, Sidebar.test.tsx, Sidebar.css.test.tsx, Sidebar.logic.test.tsx)
- [x] 1.7 BDD: Remove always-open scenarios from `sidebar_toggle.feature` and steps
- [x] 1.8 Unit tests for migration logic (always-open true → panel open true, key removed)
- [x] 1.9 Verify build passes: `pnpm run build`

## 2. Platform-aware defaults (FR7)

- [x] 2.1 Update `usePanelSide` to accept dynamic default from `useIsDesktop()`: desktop → `"left"`, mobile → `"right"`
- [x] 2.2 Update `usePanelOpen` to accept dynamic default from `useIsDesktop()`: desktop → `true`, mobile → `false`
- [x] 2.3 Update `useFilterBarPosition` to accept dynamic default from `useIsDesktop()`: desktop → `"top"`, mobile → `"bottom"`
- [x] 2.4 Update `constants/index.ts`: remove static `DEFAULT_PANEL_SIDE`, add `DESKTOP_PANEL_SIDE` / `MOBILE_PANEL_SIDE` (same for open and filter bar position)
- [x] 2.5 BDD unit tests for platform-aware defaults: desktop defaults, mobile defaults, saved value overrides default
- [x] 2.6 Update existing tests that depend on `DEFAULT_PANEL_SIDE` / `DEFAULT_FILTER_BAR_POSITION` constants
- [x] 2.7 Mutation testing on `usePanelSide`, `usePanelOpen`, `useFilterBarPosition` (scoped, max 5 files)

## 3. Toggle button and remove container onClick (FR1, FR2, NFR-A1)

- [x] 3.1 Add toggle button to `SidebarSyncBlock.tsx` expanded mode: `ChevronLeft` for right-side, `ChevronRight` for left-side. Accept `onToggle` prop.
- [x] 3.2 Remove from expanded `Sidebar.tsx` container: `onClick`, `cursor-pointer`, `role="button"`, `tabIndex`, `onKeyDown`
- [x] 3.3 Remove `stopPropagation` calls from `SidebarFilterNav.tsx` and `SidebarSyncBlock.tsx` (no longer needed)
- [x] 3.4 Add `aria-label` to toggle button (localized "Close sidebar" / "Open sidebar"), ensure keyboard accessibility (Enter/Space)
- [x] 3.5 BDD: Update `sidebar_toggle.feature` — replace "clicks the panel area" with "clicks the toggle button", add scenario "Clicking empty area does nothing"
- [x] 3.6 Unit tests for toggle button rendering per side, toggle click behavior, keyboard accessibility
- [ ] 3.7 Mutation testing on `Sidebar.tsx`, `SidebarSyncBlock.tsx` (scoped)

## 4. Modal drawer behavior (FR4, FR5, FR6)

- [x] 4.1 Extend `usePanelOpen` hook: add `isTemporarilyOpen` state, `openTemporarily()`, `closeTemporary()` methods
- [x] 4.2 Update `Sidebar.tsx`: collapsed strip click calls `openTemporarily()` when `isPanelOpen=false`
- [x] 4.3 Add `onAutoCollapse` callback prop to `SidebarFilterNav` — called on nav item click when in modal mode
- [x] 4.4 Update `TaskPageLayout.tsx`: pass `onAutoCollapse` that calls `closeTemporary()` when `isTemporarilyOpen` is true
- [x] 4.5 BDD: Create `sidebar_modal.feature` with scenarios: modal opens without persisting, modal closes on nav click, standard stays open on nav click
- [x] 4.6 Unit tests for `usePanelOpen` extended API: `openTemporarily`, `closeTemporary`, interaction with `isPanelOpen`
- [ ] 4.7 Mutation testing on `usePanelOpen.ts` (scoped)

## 5. Backdrop on mobile (FR3, NFR-A2, NFR-R1)

- [x] 5.1 Add backdrop `div` in `TaskPageLayout.tsx`: render when `!isDesktop && effectiveIsOpen`, with `onClick` to close sidebar
- [x] 5.2 Style backdrop: `fixed inset-0 bg-black/40 z-10` (sidebar at `z-20`)
- [x] 5.3 Add `aria-label` to backdrop (localized "Close sidebar")
- [x] 5.4 BDD: Create `sidebar_backdrop.feature` with scenarios: visible on mobile expanded, not visible on desktop, tap closes
- [x] 5.5 Unit tests for backdrop rendering conditions, click handler, aria-label
- [ ] 5.6 Mutation testing on `TaskPageLayout.tsx` backdrop logic (scoped)

## 6. Swipe gestures on mobile (FR8, FR9, NFR-R2)

- [x] 6.1 Create `useSidebarSwipe` hook: edge swipe detection, swipe-to-close, translateX tracking, threshold snap-back
- [x] 6.2 Add constants: `SIDEBAR_SWIPE_EDGE_ZONE_PX = 24`, `SIDEBAR_SWIPE_THRESHOLD_PERCENT = 0.3`
- [x] 6.3 Integrate `useSidebarSwipe` in `TaskPageLayout.tsx`: pass sidebar ref, side, open/close callbacks
- [x] 6.4 Apply `transform: translateX()` to sidebar during swipe for finger-following
- [x] 6.5 Handle vertical scroll cancellation: cancel swipe if vertical movement exceeds horizontal
- [x] 6.6 Disable swipe on desktop (`!isDesktop` guard)
- [x] 6.7 BDD: Create `sidebar_swipe.feature` with scenarios: edge swipe opens, swipe-back closes, incomplete swipe snaps back, vertical cancels, desktop disabled
- [x] 6.8 Unit tests for `useSidebarSwipe`: edge detection, threshold, direction per side, vertical cancellation
- [ ] 6.9 Mutation testing on `useSidebarSwipe.ts` (scoped)

## 7. Pin icon button in settings (FR11)

- [x] 7.1 Replace switch toggle in `WorkspaceSection.tsx` "detail panel pinned" section with Pin icon button + text label
- [x] 7.2 Pin icon: `fill-current` when pinned (accent color), `rotate-45` when unpinned (gray), matching `TaskDetailPanel.tsx` style
- [x] 7.3 Add `aria-label` (localized pin/unpin) and `aria-pressed` to the button
- [x] 7.4 Unit tests: pin button renders correct icon state, click toggles, accessible attributes
- [x] 7.5 Update `WorkspaceSection.test.tsx` for new pin button markup

## 8. Settings accordion all-collapsed and deep-link (FR12, FR13)

- [x] 8.1 Modify `SettingsAccordion.tsx`: change `expandedSectionId` type to `string | null`, default to `null` (all collapsed)
- [x] 8.2 Update `handleToggle`: clicking expanded section sets `null` instead of `firstSectionId`
- [x] 8.3 Update `readPersistedSection`: return `null` as fallback instead of `firstSectionId`
- [x] 8.4 Add `initialExpandedSection` prop to `SettingsAccordion` — overrides default on mount
- [x] 8.5 In `SettingsPage.tsx`: read `location.state?.expandSection`, pass as `initialExpandedSection`
- [x] 8.6 In `SidebarSyncBlock.tsx`: update "Configure server" navigation to pass `{ state: { expandSection: SETTINGS_SECTION_IDS.ACCOUNT_SYNC } }`
- [x] 8.7 Unit tests for accordion: all-collapsed default, click to collapse expanded, deep-link opens section
- [x] 8.8 Update `SettingsAccordion.test.tsx` for new default behavior
- [ ] 8.9 Mutation testing on `SettingsAccordion.tsx` (scoped)

## 9. i18n keys

- [x] 9.1 Add i18n keys to `ru.json` and `en.json`: `sidebar.close`, `sidebar.open`, `sidebar.closeBackdrop` (or reuse existing `filter.close`/`filter.open` if sufficient)

## 10. Final verification

- [x] 10.1 Verify build: `pnpm run build`
- [x] 10.2 Run full BDD sidebar suite: all sidebar feature files pass
- [x] 10.3 Run existing page tests that use sidebar mocks (InboxPage, GoalsPage, etc.) — verify no regressions
- [x] 10.4 Run settings page tests — verify no regressions
- [x] 10.5 Check JetBrains IDE diagnostics on all changed files
