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
- [x] 5.3 Run `pnpm run lint:fix` and fix issues
- [x] 5.4 ~~Run mutation testing~~ — final score 98.83% (see section 6)
- [x] 5.5 Run `pnpm run build` — build succeeds

## 6. Kill survived mutants (M3 — target >= 95%)

Baseline: 39.45% (101 killed / 256 total). 122 survived, 33 no coverage.

### 6.1 `useSidebarNavigation.ts` — 22 mutants (0% score)

Create `packages/client/src/hooks/useSidebarNavigation.test.ts`:
- null mode → no navigation call
- `"search"` mode → `navigate(ROUTES.SEARCH)`
- mode with route (e.g. `"contexts"`) → `navigate(ROUTES.CONTEXTS)`
- mode without route (e.g. `"inbox"`) → `navigate(ROUTES.INBOX, { state: { filterMode: "inbox" } })`
- returned function is stable reference (useCallback with [navigate])

Kills: 8 ConditionalExpression, 5 BlockStatement, 3 EqualityOperator, 2 ObjectLiteral, 1 StringLiteral, 1 ArrowFunction, 1 OptionalChaining, 1 ArrayDeclaration

- [x] 6.1 Create unit tests for `useSidebarNavigation` hook (22 mutants)

### 6.2 `Sidebar.tsx` — CSS class assertions (26 StringLiteral + 4 LogicalOperator)

Add tests to `Sidebar.test.tsx` or BDD steps verifying rendered CSS classes:
- `border-r border-accent/70` when side=right, `border-l border-accent/70` when side=left
- `order-first flex-row-reverse` on outer wrapper when isLeft
- `cursor-pointer` present when `!isPanelAlwaysOpen`, absent when `isPanelAlwaysOpen`
- `w-52` on expanded panel, `w-14` on collapsed strip
- `left-0` when isLeft, `right-0` when isRight (absolute positioning)
- `absolute top-0 bottom-0 z-20 md:relative md:z-auto` on expanded panel
- `bg-accent` on panel containers
- `md:hidden w-14 flex-shrink-0` on mobile placeholder (expanded only)

Kills: ~30 StringLiteral + LogicalOperator mutants

- [x] 6.2 Add Sidebar CSS class verification tests (30 mutants)

### 6.3 `Sidebar.tsx` — conditional logic (12 ConditionalExpression + 5 BooleanLiteral + 2 ArrowFunction + 2 EqualityOperator + 1 MethodExpression)

Add tests verifying:
- `effectiveIsOpen=true` when `isPanelAlwaysOpen=true` even if `isOpen=false` → renders expanded
- `isPanelAlwaysOpen=true` → no `onClick`, no `aria-label`, no `role`, no `tabIndex`, no `onKeyDown`
- `isPanelAlwaysOpen=false` → has `cursor-pointer`, `role="button"`, `tabIndex=0`
- `onKeyDown` Enter on collapsed panel → calls `onToggle` (NoCoverage line 151)
- `onKeyDown` Enter on expanded panel (not always-open) → calls `onToggle`
- `isExpanded=true` passed to SidebarSyncBlock/SidebarFilterNav when open
- `isExpanded=false` passed when collapsed
- `menuOrder` filtering — only visible items rendered (MethodExpression line 113)

Kills: ~22 mutants

- [x] 6.3 Add Sidebar conditional logic tests (22 mutants)

### 6.4 `SidebarSyncBlock.tsx` — CSS and layout (23 StringLiteral + 4 LogicalOperator)

Add tests verifying:
- `animate-spin` class on RefreshCw icon when `isSyncing=true`, absent when not
- `bg-red-500` error badge dot visible when `hasSyncError=true`
- `flex-row-reverse` on expanded sync button when `isLeft=true`
- Button order in expanded: account first when isLeft, sync first when isRight
- Collapsed button class `COLLAPSED_BUTTON_CLASS` applied
- Expanded button classes for sync/sign-in/login variants
- UserAvatar `rounded-full` class, `w-8 h-8` / `w-6 h-6` sizes

Kills: ~27 mutants

- [x] 6.4 Add SidebarSyncBlock CSS and layout tests (27 mutants)

### 6.5 `SidebarSyncBlock.tsx` — conditional rendering (20 ConditionalExpression + 7 BlockStatement + 1 EqualityOperator)

Add tests verifying:
- Collapsed: `needsSignIn` → sign-in btn, `isConfigured` → sync btn, else → account btn
- Expanded: `needsSignIn` → sign-in btn with text, `isConfigured` → sync btn with label, else → login btn
- `syncLabel` text: syncing → "Синхронизация...", offline → "Нет связи", error → "Ошибка сервера", synced → "Синхронизировано"
- Handler bodies: `stopPropagation` called on click, `pull()` called on sync click, `signIn()` on sign-in, `navigate(ROUTES.SETTINGS)` on account/login
- `isLeft` → `side === "left"` check affects button layout

Kills: ~28 mutants

- [x] 6.5 Add SidebarSyncBlock conditional rendering tests (28 mutants)

### 6.6 `SidebarFilterNav.tsx` — rendering and interactions (13 StringLiteral + 6 ConditionalExpression + 4 BlockStatement + 2 BooleanLiteral + 1 EqualityOperator)

Add tests verifying:
- Expanded: `nav` with `aria-label`, items with `gap-3 px-3 py-3`, search button with text
- Collapsed: items with `w-10 h-10`, no text labels, search icon-only
- Active item: `bg-white/20 text-white` class applied
- Inactive item: `text-white/80 hover:bg-white/10` class applied
- `focused_goals` item → renders `FocusedGoalsBlock` with correct `isExpanded` prop
- `handleFilterClick`: item with route → `navigate(route)`, active item without route → `onModeChange(null)`, inactive item without route → `onModeChange(mode)`
- `handleSearchClick`: `stopPropagation` + `navigate(ROUTES.SEARCH)`
- `aria-pressed` matches active state

Kills: ~26 mutants

- [x] 6.6 Add SidebarFilterNav rendering and interaction tests (26 mutants)

### 6.7 Re-run mutation testing

- [x] 6.7 Re-run mutation testing — score 98.83% >= 95% (M3) ✓
