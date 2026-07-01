## Context

InboxPage.tsx (1023 lines) serves 4+ modes via `location.state.filterMode`. Sidebar switches modes via state-toggle for inbox/tasks/completed, and via route navigation for goals/contexts/categories/ideas/deleted/search. This creates asymmetry: some modes are pages, others are states within a single page.

Current structure:
- `InboxPage` contains an inline `TaskSection` component (lines 33-114), 8 identical completion handlers, a 283-line `renderContent()`, and a split-pane layout repeated in GoalDetailPage, SearchPage, etc.
- `useSidebarNavigation` uses a fallback `navigate(ROUTES.INBOX, { state: { filterMode: newMode } })` for modes without routes
- TodayPage/WeekPage/LaterPage stubs (3 lines each) and PageShell/BottomNav wrappers are not used as intended
- GoalPage.tsx is dead code (not imported in router)

Driven by G1, G2, G3, G4 from proposal.

## Goals / Non-Goals

**Goals:**
- Each task view is a separate page with its own route, < 200 lines (FR1-FR4)
- Shared layout and hooks reused without duplication (FR6-FR9)
- Sidebar: all task modes navigate via routes (FR5)
- Dead code removed (FR10-FR12)

**Non-Goals:**
- No changes to task CRUD/sync logic (NG1)
- No changes to GoalDetailPage, SearchPage, DeletedPage (NG2, NG4)
- No new functionality (NG5)

## Decisions

### D1: Composition via TaskPageLayout + page-specific content

**Decision**: Create `TaskPageLayout` — a shared layout component providing split-pane + Sidebar + TaskDetailPanel. Each task page passes its content via `children`.

**Alternative**: HOC or render-props pattern. Rejected — composition via children is simpler and more idiomatic in React.

**Alternative**: Single page with route parameter (TasksPage?view=inbox). Rejected — violates "one route = one component" principle and complicates code splitting.

```
TaskPageLayout
├── Split Container (usePanelSplit)
│   ├── Main Column (children from page)
│   │   ├── topToolbar? (BoxFilterBar, AddTaskInput, etc.)
│   │   ├── <main> scrollable area
│   │   │   └── {children}
│   │   └── bottomToolbar?
│   ├── Resize Handle (desktop only)
│   └── TaskDetailPanel (when task selected)
└── Sidebar (mode prop highlights active item)
```

**Rationale (FR6)**: This pattern repeats in InboxPage, GoalDetailPage, SearchPage. Extraction eliminates ~80 lines of layout duplication per page.

### D2: useTaskSelection — shared hook for task selection management

**Decision**: Extract into a separate hook: `selectedTaskId`, `expandedTaskId`, `selectedTask`, `handleTaskSelect`, `handleTaskExpand`, `handleDetailPanelClose`, task resolution effect from arrays.

**Rationale (FR8)**: This logic is identical across all task pages and amounts to ~60 lines each.

### D3: useTaskCompletion — parameterized replacement for 8 handlers

**Decision**: A single hook accepting `completeFn` and returning a callback. Handles recurring tasks (new id), selection/expansion cleanup.

**Alternative**: Utility function instead of hook. Rejected — needs access to selection state from useTaskSelection.

**Rationale (FR9)**: 8 handlers in InboxPage follow the same pattern, differing only in `completeFn`.

### D4: TaskSection — extracting inline component

**Decision**: Extract `TaskSection` from InboxPage (lines 33-114) to `components/tasks/TaskSection.tsx`. A collapsible section with header, count, and TaskList.

**Difference from BoxSectionList**: `TaskSection` is generic (any label, emptyMessage), `BoxSectionList` is specific to box grouping with predefined labels. Both use `useSectionCollapse` + `TaskList`. Not merging — different use cases.

**Rationale (FR7)**: Used 8+ times in InboxPage, will be used on ActiveTasksPage and CompletedPage.

### D5: Routes — `/inbox`, `/tasks`, `/completed`

**Decision**:
- `ROUTES.INBOX = "/inbox"` (was `/tasks`)
- `ROUTES.TASKS = "/tasks"` (new, active tasks)
- `ROUTES.COMPLETED = "/completed"` (new)
- `/` redirects to `/tasks`

**Rationale (FR1-FR5)**: `/tasks` as the main route (redirect from `/`) — users work with active tasks most often.

### D6: Sidebar — all task modes get routes

**Decision**: Add `route` to FILTER_ITEMS for inbox, tasks, completed. `SidebarFilterNav.handleFilterClick` already navigates when route is present — minimal change.

Simplify `useSidebarNavigation`: remove the `location.state.filterMode` fallback.

**Rationale (FR5)**: Eliminates asymmetry between modes. All sidebar modes work via navigation.

### D7: Implementation order — extract first, then create, then simplify

**Decision**:
1. Extract shared code (hooks, components) from InboxPage, replace with imports — no behavior change
2. Create new pages and routes — additive
3. Update Sidebar and navigation — switch from state to routes
4. Simplify InboxPage — remove unnecessary modes
5. Delete dead code

**Rationale**: Minimizes risk at each step. Tests pass after each phase.

## Risks / Trade-offs

- **[Bookmark breakage]** Users with bookmarks to `/tasks` (old inbox) will land on ActiveTasksPage instead of inbox. → Mitigation: `/tasks` now contains active tasks — a more useful default.
- **[BottomNav removal]** Mobile navigation via BottomNav is lost. → Mitigation: Sidebar already works on mobile.
- **[Test adaptation]** InboxPage.test.tsx (1290 lines) will require significant rework. → Mitigation: Extract-first phase preserves existing tests; new tests are created for new components.
