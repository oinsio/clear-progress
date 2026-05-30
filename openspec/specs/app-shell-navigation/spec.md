# Capability: App Shell Navigation

## Purpose

Application shell providing the outer layout container (AppShell), routing configuration with layout nesting, and error boundary.

## Requirements

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

### Requirement: Route errors are caught

Route errors SHALL be caught by RouteErrorFallback (errorElement on the AppLayout route). The error SHALL be logged to console and an ErrorFallback component SHALL be shown.

#### Scenario: Route error shows fallback
- **WHEN** a route throws an error
- **THEN** RouteErrorFallback is displayed

