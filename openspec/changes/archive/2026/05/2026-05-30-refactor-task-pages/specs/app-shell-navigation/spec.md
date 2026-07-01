## MODIFIED Requirements

### Requirement: Root path redirects to Inbox

The root path "/" SHALL redirect to the active tasks route (ROUTES.TASKS = "/tasks"). Implements FR4 of refactor-task-pages.

#### Scenario: Root redirects to active tasks
- **WHEN** user navigates to "/"
- **THEN** user is redirected to "/tasks"

### Requirement: Layout nesting with AppShell

All page routes SHALL be wrapped in AppLayout (AppShell + Outlet). Implements FR10, FR11 of refactor-task-pages.

#### Scenario: All routes use AppShell
- **WHEN** any page route is rendered
- **THEN** the page content is wrapped in AppShell

## REMOVED Requirements

### Requirement: BottomNav renders five navigation items

**Reason**: BottomNav was only used in PageShell which wrapped TodayPage/WeekPage/LaterPage stubs. These stubs are removed and replaced by ActiveTasksPage. Sidebar provides mobile navigation.
**Migration**: Mobile users navigate via Sidebar (already supports mobile with collapsed/expanded states).

### Requirement: Active navigation item is visually distinguished

**Reason**: Removed with BottomNav.
**Migration**: Sidebar highlights active route.

### Requirement: Navigation uses translated labels

**Reason**: Removed with BottomNav.
**Migration**: Sidebar uses translated labels.

### Requirement: Navigation items have icons

**Reason**: Removed with BottomNav.
**Migration**: Sidebar uses icons.

### Requirement: BottomNav uses nav element with aria-label

**Reason**: Removed with BottomNav.
**Migration**: Sidebar provides accessible navigation.

### Requirement: BottomNav responsive visibility

**Reason**: Removed with BottomNav and PageShell.
**Migration**: Sidebar handles responsive visibility.
