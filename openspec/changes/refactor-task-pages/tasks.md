## 1. Extract shared hooks (FR8, FR9)

- [x] 1.1 Create `useTaskCompletion` hook with TDD — parameterized completion handler replacing 8 identical handlers (FR9)
- [x] 1.2 Create `useTaskSelection` hook with TDD — selectedTaskId, expandedTaskId, selectedTask resolution, handleTaskSelect, handleTaskExpand, handleDetailPanelClose (FR8)
- [x] 1.3 Mutation testing for useTaskCompletion and useTaskSelection (>= 90%)

## 2. Extract shared components (FR6, FR7)

- [x] 2.1 Extract `TaskSection` from InboxPage (lines 33-114) to `components/tasks/TaskSection.tsx` with TDD (FR7)
- [x] 2.2 Create `TaskPageLayout` component with TDD — split-pane + Sidebar + TaskDetailPanel shell (FR6)
- [x] 2.3 Mutation testing for TaskSection and TaskPageLayout (>= 90%)

## 3. Wire extracted code into InboxPage (no behavior change)

- [x] 3.1 Replace inline TaskSection in InboxPage with imported component
- [x] 3.2 Replace inline selection/completion logic with useTaskSelection and useTaskCompletion
- [x] 3.3 Replace inline layout with TaskPageLayout
- [x] 3.4 Verify existing InboxPage tests still pass

## 4. Update routes and constants (FR4, FR10)

- [x] 4.1 Change `ROUTES.INBOX` to `/inbox`, add `ROUTES.TASKS = "/tasks"`, add `ROUTES.COMPLETED = "/completed"`
- [x] 4.2 Remove `ROUTES.TODAY`, `ROUTES.WEEK`, `ROUTES.LATER`
- [x] 4.3 Update router.tsx: add routes for ActiveTasksPage, CompletedPage; redirect `/` → `/tasks`; remove TodayPage/WeekPage/LaterPage routes and PageLayout wrapper
- [x] 4.4 Fix BOX_FILTER_LABELS: replace hardcoded Russian strings with i18n keys (FR13)

## 5. Create new pages (FR1, FR2, FR3)

- [x] 5.1 Create `ActiveTasksPage` with TDD — today/week/later TaskSections + BoxFilterBar + completed-today section (FR2)
- [x] 5.2 Create `CompletedPage` with TDD — completed tasks grouped by date (today/yesterday/week/month/earlier) (FR3)
- [x] 5.3 Mutation testing for ActiveTasksPage and CompletedPage (>= 90%)

## 6. Update Sidebar navigation (FR5)

- [x] 6.1 Add `route` to FILTER_ITEMS for inbox (`/inbox`), tasks (`/tasks`), completed (`/completed`)
- [x] 6.2 Simplify `useSidebarNavigation` — remove `location.state.filterMode` fallback
- [x] 6.3 Update all pages using `useSidebarNavigation` to work with simplified hook
- [x] 6.4 Update Sidebar tests for new route-based navigation

## 7. Simplify InboxPage (FR1)

- [x] 7.1 Remove all modes except inbox from InboxPage (tasks, completed, focused_goals, search, contexts, categories) — includes dead code: search mode (searchQuery, searchResults, useSearch, searchDebounceRef, handleSearchChange, search input, renderContent search-branch) and context/category filter state (selectedContextId, selectedCategoryId, applyFilters context/category branches — always null) (FR14)
- [x] 7.2 Remove filterMode state, location.state handling, renderContent() switch
- [x] 7.3 Set sidebarMode="inbox" on TaskPageLayout
- [x] 7.4 Update InboxPage tests — remove tests for removed modes, adapt to new structure

## 8. Remove dead code (FR10, FR11, FR12)

- [x] 8.1 Delete TodayPage.tsx, WeekPage.tsx, LaterPage.tsx stubs
- [x] 8.2 Delete PageShell.tsx and BottomNav.tsx
- [x] 8.3 Delete GoalPage.tsx and GoalPage.test.tsx (dead code)
- [x] 8.4 Remove unused imports from router.tsx

## 9. Verification

- [x] 9.1 Run `pnpm run build` — verify clean build
- [x] 9.2 Run `getDiagnostics` for all changed files
- [x] 9.3 Run full unit test suite for changed files
- [x] 9.4 Verify all pages < 200 lines (M1-M4)
- [x] 9.5 Verify no remaining references to deleted files (grep for GoalPage, TodayPage, PageShell, BottomNav)
