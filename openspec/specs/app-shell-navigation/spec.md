# Capability: App Shell Navigation

## Purpose

Application shell providing the navigation frame: BottomNav for mobile navigation, AppShell as the outer layout container, PageShell as the per-page wrapper with BottomNav, and routing configuration with layout nesting and error boundary.

## Requirements

### Requirement: BottomNav renders five navigation items

BottomNav SHALL render exactly five navigation items in order: Inbox, Today, Goals, Ideas, Search. Each item SHALL link to its corresponding route from the ROUTES constant.

#### Scenario: All five navigation items are rendered
- **WHEN** BottomNav is rendered
- **THEN** five navigation links are present: Inbox, Today, Goals, Ideas, Search

#### Scenario: Navigation items link to correct routes
- **WHEN** BottomNav is rendered
- **THEN** Inbox links to "/tasks"
- **AND** Today links to "/today"
- **AND** Goals links to "/goals"
- **AND** Ideas links to "/ideas"
- **AND** Search links to "/search"

#### Scenario: Navigation items have correct order
- **WHEN** BottomNav is rendered
- **THEN** items appear in order: Inbox, Today, Goals, Ideas, Search

### Requirement: Active navigation item is visually distinguished

The currently active navigation item SHALL have aria-current="page" set by NavLink. Non-active items SHALL NOT have aria-current.

#### Scenario: Active item has aria-current page
- **WHEN** user is on the "/tasks" route
- **THEN** Inbox navigation item has aria-current="page"

#### Scenario: Non-active items lack aria-current
- **WHEN** user is on the "/tasks" route
- **THEN** Today navigation item does NOT have aria-current

### Requirement: Navigation uses translated labels

BottomNav SHALL use i18n translation keys (nav.*) for all labels. The nav element SHALL have an aria-label from i18n.

#### Scenario: Labels come from i18n
- **WHEN** BottomNav is rendered
- **THEN** each item label is resolved via t("nav.*") translation key

#### Scenario: Nav element has aria-label
- **WHEN** BottomNav is rendered
- **THEN** the navigation element has a descriptive aria-label

### Requirement: Navigation items have icons

Each navigation item SHALL render a Lucide icon with aria-hidden="true" to prevent screen reader duplication.

#### Scenario: Icons have aria-hidden
- **WHEN** BottomNav is rendered
- **THEN** each navigation item icon has aria-hidden="true"

### Requirement: Root path redirects to Inbox

The root path "/" SHALL redirect to the Inbox route (ROUTES.INBOX = "/tasks").

#### Scenario: Root redirects to inbox
- **WHEN** user navigates to "/"
- **THEN** user is redirected to "/tasks"

### Requirement: Layout nesting with AppShell

All page routes SHALL be wrapped in AppLayout (AppShell + Outlet). Today, Week, and Later routes SHALL additionally be wrapped in PageLayout (PageShell + Outlet with BottomNav).

#### Scenario: All routes use AppShell
- **WHEN** any page route is rendered
- **THEN** the page content is wrapped in AppShell

#### Scenario: Time-box routes use PageShell
- **WHEN** Today, Week, or Later page is rendered
- **THEN** the page content is additionally wrapped in PageShell with BottomNav

### Requirement: Route errors are caught

Route errors SHALL be caught by RouteErrorFallback (errorElement on the AppLayout route). The error SHALL be logged to console and an ErrorFallback component SHALL be shown.

#### Scenario: Route error shows fallback
- **WHEN** a route throws an error
- **THEN** RouteErrorFallback is displayed

### Requirement: BottomNav uses nav element with aria-label

BottomNav SHALL render a `<nav>` element with a descriptive aria-label for accessibility.

#### Scenario: Nav element is semantic
- **WHEN** BottomNav is rendered
- **THEN** a `<nav>` element is present with an aria-label

### Requirement: BottomNav responsive visibility

BottomNav SHALL be visible on mobile viewports (below md breakpoint) and hidden on desktop viewports (md and above) via the md:hidden CSS class on the wrapper in PageShell.

#### Scenario: BottomNav hidden on desktop
- **WHEN** viewport is at or above md breakpoint
- **THEN** BottomNav wrapper has md:hidden class

### Requirement: Right panel login button navigates to Settings

When no backend is configured, the right panel SHALL display a "Configure server" button that navigates to `/settings`. The button SHALL NOT navigate to `/setup`.

#### Scenario: Configure server button visible when not connected
- **WHEN** right panel is rendered
- **AND** no backend is configured
- **THEN** a "Configure server" button is displayed

#### Scenario: Configure server button navigates to Settings
- **WHEN** user clicks the "Configure server" button
- **THEN** app navigates to `/settings`
