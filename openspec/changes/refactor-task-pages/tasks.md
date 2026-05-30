## 1. Extract shared hooks (FR8, FR9)

- [ ] 1.1 Create `useTaskCompletion` hook with TDD — parameterized completion handler replacing 8 identical handlers (FR9)
- [ ] 1.2 Create `useTaskSelection` hook with TDD — selectedTaskId, expandedTaskId, selectedTask resolution, handleTaskSelect, handleTaskExpand, handleDetailPanelClose (FR8)
- [ ] 1.3 Mutation testing for useTaskCompletion and useTaskSelection (>= 90%)

## 2. Extract shared components (FR6, FR7)

- [ ] 2.1 Extract `TaskSection` from InboxPage (lines 33-114) to `components/tasks/TaskSection.tsx` with TDD (FR7)
- [ ] 2.2 Create `TaskPageLayout` component with TDD — split-pane + Sidebar + TaskDetailPanel shell (FR6)
- [ ] 2.3 Mutation testing for TaskSection and TaskPageLayout (>= 90%)

## 3. Wire extracted code into InboxPage (no behavior change)

- [ ] 3.1 Replace inline TaskSection in InboxPage with imported component
- [ ] 3.2 Replace inline selection/completion logic with useTaskSelection and useTaskCompletion
- [ ] 3.3 Replace inline layout with TaskPageLayout
- [ ] 3.4 Verify existing InboxPage tests still pass

## 4. Update routes and constants (FR4, FR10)

- [ ] 4.1 Change `ROUTES.INBOX` to `/inbox`, add `ROUTES.TASKS = "/tasks"`, add `ROUTES.COMPLETED = "/completed"`
- [ ] 4.2 Remove `ROUTES.TODAY`, `ROUTES.WEEK`, `ROUTES.LATER`
- [ ] 4.3 Update router.tsx: add routes for ActiveTasksPage, CompletedPage; redirect `/` → `/tasks`; remove TodayPage/WeekPage/LaterPage routes and PageLayout wrapper
- [ ] 4.4 Fix BOX_FILTER_LABELS: replace hardcoded Russian strings with i18n keys (FR13)

## 5. Create new pages (FR1, FR2, FR3)

- [ ] 5.1 Create `ActiveTasksPage` with TDD — today/week/later TaskSections + BoxFilterBar + completed-today section (FR2)
- [ ] 5.2 Create `CompletedPage` with TDD — completed tasks grouped by date (today/yesterday/week/month/earlier) (FR3)
- [ ] 5.3 Mutation testing for ActiveTasksPage and CompletedPage (>= 90%)

## 6. Update Sidebar navigation (FR5)

- [ ] 6.1 Add `route` to FILTER_ITEMS for inbox (`/inbox`), tasks (`/tasks`), completed (`/completed`)
- [ ] 6.2 Simplify `useSidebarNavigation` — remove `location.state.filterMode` fallback
- [ ] 6.3 Update all pages using `useSidebarNavigation` to work with simplified hook
- [ ] 6.4 Update Sidebar tests for new route-based navigation

## 7. Simplify InboxPage (FR1)

- [ ] 7.1 Remove all modes except inbox from InboxPage (tasks, completed, focused_goals, search, contexts, categories) — includes dead code: search mode (searchQuery, searchResults, useSearch, searchDebounceRef, handleSearchChange, search input, renderContent search-branch) and context/category filter state (selectedContextId, selectedCategoryId, applyFilters context/category branches — always null) (FR14)
- [ ] 7.2 Remove filterMode state, location.state handling, renderContent() switch
- [ ] 7.3 Set sidebarMode="inbox" on TaskPageLayout
- [ ] 7.4 Update InboxPage tests — remove tests for removed modes, adapt to new structure

## 8. Remove dead code (FR10, FR11, FR12)

- [ ] 8.1 Delete TodayPage.tsx, WeekPage.tsx, LaterPage.tsx stubs
- [ ] 8.2 Delete PageShell.tsx and BottomNav.tsx
- [ ] 8.3 Delete GoalPage.tsx and GoalPage.test.tsx (dead code)
- [ ] 8.4 Remove unused imports from router.tsx

## 9. Verification

- [ ] 9.1 Run `pnpm run build` — verify clean build
- [ ] 9.2 Run `getDiagnostics` for all changed files
- [ ] 9.3 Run full unit test suite for changed files
- [ ] 9.4 Verify all pages < 200 lines (M1-M4)
- [ ] 9.5 Verify no remaining references to deleted files (grep for GoalPage, TodayPage, PageShell, BottomNav)
