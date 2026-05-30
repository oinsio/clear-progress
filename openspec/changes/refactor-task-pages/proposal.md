# Refactor Task Pages

## Why

InboxPage.tsx (1023 lines) is a monolithic page serving 4+ modes via sidebar state (`inbox`, `tasks`, `completed`, `focused_goals`, `search`). It exceeds the 200-line limit by 5x, contains 8 duplicate completion handlers, 11 state variables, and a 283-line `renderContent()`. Modes are switched via `location.state.filterMode` instead of routes, making navigation unpredictable and testing difficult.

## What Changes

- **ADDED**: Separate ActiveTasksPage (`/tasks`) — today/week/later tasks with BoxFilterBar and "completed today" section
- **ADDED**: Separate CompletedPage (`/completed`) — all completed tasks grouped by date
- **ADDED**: Shared layout component TaskPageLayout — split-pane + sidebar + TaskDetailPanel
- **ADDED**: Shared hooks useTaskSelection, useTaskCompletion
- **ADDED**: Reusable TaskSection component (extracted from InboxPage)
- **MODIFIED**: InboxPage (`/inbox`) — inbox tasks only, ~120 lines
- **MODIFIED**: Sidebar — inbox/tasks/completed modes navigate to routes instead of toggling state
- **MODIFIED**: Route `/` redirects to `/tasks` (active tasks)
- **REMOVED**: TodayPage, WeekPage, LaterPage stubs and their routes
- **REMOVED**: PageShell, BottomNav (consumers of removed stubs)
- **REMOVED**: GoalPage + GoalPage.test.tsx (dead code, duplicate of GoalDetailPage)
- **MODIFIED**: BOX_FILTER_LABELS — hardcoded Russian strings replaced with i18n keys

## Goals

- **G1**: Each task page < 200 lines (300 hard cap)
- **G2**: Each task view (inbox, active, completed) has its own route and separate page
- **G3**: Shared layout and logic reused across pages without duplication
- **G4**: All dead code removed

## Non-Goals

- **NG1**: No changes to task CRUD/sync/recurring logic
- **NG2**: No changes to GoalDetailPage (only reuse its patterns)
- **NG3**: No changes to focused_goals behavior (remains as links to GoalDetailPage)
- **NG4**: No changes to DeletedPage
- **NG5**: No new functionality — refactoring only

## Users & Scenarios

- **U1**: User switches between inbox, active tasks, and completed via sidebar — each click navigates to its own route
- **U2**: User opens `/tasks` — sees today/week/later tasks with BoxFilterBar
- **U3**: User opens `/inbox` — sees only inbox tasks
- **U4**: User opens `/completed` — sees completed tasks grouped by date

## Requirements

### Functional

- **FR1**: InboxPage (`/inbox`) displays only inbox box tasks with add and manage capabilities
- **FR2**: ActiveTasksPage (`/tasks`) displays today/week/later tasks with BoxFilterBar (filter by box or all) and a "completed today" section
- **FR3**: CompletedPage (`/completed`) displays all completed tasks grouped by date (today/yesterday/week/month/earlier)
- **FR4**: `/` redirects to `/tasks`
- **FR5**: Sidebar modes `inbox`, `tasks`, `completed` navigate to corresponding routes (like `goals`, `contexts`)
- **FR6**: TaskPageLayout provides shared split-pane layout with Sidebar and TaskDetailPanel for all task pages
- **FR7**: TaskSection — reusable collapsible section component with header, count, and TaskList
- **FR8**: useTaskSelection manages task selection, detail panel, and expand state
- **FR9**: useTaskCompletion — parameterized completion handler with recurring support and selection/expansion management
- **FR10**: TodayPage, WeekPage, LaterPage stubs and their routes `/today`, `/week`, `/later` removed
- **FR11**: PageShell and BottomNav components removed
- **FR12**: GoalPage and GoalPage.test.tsx removed (dead code)
- **FR13**: BOX_FILTER_LABELS converted from hardcoded Russian strings to i18n keys
- **FR14**: Dead code removed from InboxPage: search mode (searchQuery, searchResults, useSearch, search input, handleSearchChange, renderContent search branch — search already works via SearchPage) and context/category filter state (selectedContextId, selectedCategoryId, applyFilters context/category branches — always null, contexts/categories navigate to separate pages)

### Non-Functional

#### Accessibility — NFR-A1

- **NFR-A1**: All task pages preserve existing aria attributes and keyboard navigation

#### Responsive — NFR-R1

- **NFR-R1**: All task pages work correctly on mobile (full-screen detail panel) and desktop (split-pane)

## UX Acceptance Criteria

- **UX1**: Switching between inbox/tasks/completed via sidebar works instantly (route navigation)
- **UX2**: BoxFilterBar on ActiveTasksPage works identically to current behavior in InboxPage (tasks mode)
- **UX3**: Task detail panel works the same on all pages (split-pane on desktop, fullscreen on mobile)
- **UX4**: Focus mode (dimming) works on all task pages

## UI States Matrix

| State | InboxPage | ActiveTasksPage | CompletedPage |
|-------|-----------|-----------------|---------------|
| Loading | Spinner/skeleton | Spinner/skeleton | Spinner/skeleton |
| Empty | "No tasks" + prompt | "No tasks" + prompt | "No completed tasks" |
| With data | TaskSection (inbox) | TaskSections by box + completed today | TaskSections by date group |
| Task selected (desktop) | Split-pane + detail panel | Split-pane + detail panel | Split-pane + detail panel |
| Task selected (mobile) | Fullscreen detail panel | Fullscreen detail panel | Fullscreen detail panel |
| Focus mode | Dimmed non-selected | Dimmed non-selected | Dimmed non-selected |

## Capabilities

### New Capabilities

- `task-page-layout`: Shared layout for task pages (TaskPageLayout, useTaskSelection, useTaskCompletion, TaskSection)

### Modified Capabilities

- `app-shell-navigation`: New routes `/inbox`, `/tasks`, `/completed`; removed `/today`, `/week`, `/later`; redirect `/` to `/tasks`; removed PageShell, BottomNav
- `sidebar-navigation`: Modes inbox/tasks/completed get routes and navigate instead of state-toggle

## Impact

- `packages/client/src/pages/` — InboxPage refactored, ActiveTasksPage and CompletedPage added
- `packages/client/src/components/tasks/` — TaskPageLayout, TaskSection added
- `packages/client/src/hooks/` — useTaskSelection, useTaskCompletion added
- `packages/client/src/components/tasks/Sidebar.tsx` — FILTER_ITEMS get routes
- `packages/client/src/hooks/useSidebarNavigation.ts` — simplified (all modes have routes)
- `packages/client/src/app/router.tsx` — new routes, stubs removed
- `packages/client/src/constants/index.ts` — ROUTES.INBOX changed to `/inbox`, ROUTES.TASKS and ROUTES.COMPLETED added
- All pages using `useSidebarNavigation` — adapted to simplified hook

## Affected IA

Requires update: routes `/today`, `/week`, `/later` removed; `/inbox`, `/completed` added; `/tasks` changes purpose (was inbox, now active tasks).

## Success Metrics

- **M1**: InboxPage < 200 lines (was 1023)
- **M2**: ActiveTasksPage < 200 lines
- **M3**: CompletedPage < 200 lines
- **M4**: TaskPageLayout < 200 lines
- **M5**: 0 dead code (GoalPage, stubs, PageShell, BottomNav removed)
- **M6**: All existing tests pass after adaptation
- **M7**: Mutation testing >= 90% on new hooks and components

## Open Questions

No open questions.
