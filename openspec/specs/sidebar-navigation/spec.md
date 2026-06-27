# Capability: Sidebar Navigation

## Purpose

Sidebar panel providing quick navigation between views (inbox, tasks, goals, ideas, contexts, categories, completed, deleted, search), sync status display, and account access. Supports three effective states (expanded, collapsed, hover-ready), left/right placement, and configurable menu order.

## Requirements

### Requirement: Sidebar renders in three effective states

The sidebar SHALL support three effective visual states: **expanded** (icons + labels, `w-52`, pushes content), **collapsed** (icons only, `w-14`, pushes content), and **hover-ready** (icons only, `w-14`, expands as overlay on hover — see sidebar-hover-expand spec). The effective state is determined by the state resolution matrix (see sidebar-state-matrix spec). Implements FR1, FR8 of improve-sidebar-ux.

#### Scenario: Sidebar renders expanded state
- **WHEN** effective state is `expanded`
- **THEN** sidebar shows icons and labels
- **AND** sidebar width is `w-52`
- **AND** sidebar pushes main content

#### Scenario: Sidebar renders collapsed state
- **WHEN** effective state is `collapsed`
- **THEN** sidebar shows icons only
- **AND** sidebar width is `w-14`
- **AND** sidebar pushes main content

#### Scenario: Sidebar renders hover-ready state (not hovering)
- **WHEN** effective state is `hover-ready`
- **AND** mouse is NOT hovering over sidebar
- **THEN** sidebar shows icons only (same as collapsed)
- **AND** sidebar width is `w-14`

### Requirement: Collapsed sidebar icon click navigates directly

In collapsed and hover-ready (not hovering) states, clicking a navigation icon SHALL navigate to the corresponding route immediately without expanding the sidebar. Implements FR7, FR10 of improve-sidebar-ux.

#### Scenario: Clicking icon in collapsed sidebar navigates
- **WHEN** effective state is `collapsed`
- **AND** user clicks the "Goals" navigation icon
- **THEN** app navigates to the goals route
- **AND** sidebar remains collapsed

#### Scenario: Clicking icon in hover-ready sidebar navigates
- **WHEN** effective state is `hover-ready`
- **AND** sidebar is not hover-expanded
- **AND** user clicks a navigation icon
- **THEN** app navigates to the corresponding route
- **AND** sidebar remains in hover-ready state

### Requirement: Expanded sidebar navigation click does not collapse

In expanded state (not drawer), clicking a navigation item SHALL navigate without collapsing the sidebar. Implements FR1 of improve-sidebar-ux.

#### Scenario: Clicking nav item in expanded sidebar keeps sidebar open
- **WHEN** effective state is `expanded`
- **AND** user clicks the "Goals" navigation item
- **THEN** app navigates to the goals route
- **AND** sidebar remains expanded

### Requirement: Sidebar supports left and right placement

The sidebar SHALL render on the left or right side of the screen based on the `side` prop. Left placement SHALL use `order-first` and reverse element order for sync/account buttons.

#### Scenario: Right placement renders default layout
- **WHEN** sidebar side is "right"
- **THEN** sidebar renders with left border
- **AND** sync button appears before account button

#### Scenario: Left placement reverses layout
- **WHEN** sidebar side is "left"
- **THEN** sidebar renders with right border
- **AND** sidebar has `order-first` class
- **AND** account button appears before sync button

### Requirement: Mode selection changes active filter

Clicking a filter item SHALL navigate to its route if one is defined. For items without a route (focused_goals only), clicking SHALL toggle the active mode. The active mode SHALL be visually distinguished with `bg-white/20`. All task-related modes (inbox, tasks, completed) and content modes (goals, ideas, contexts, categories, deleted, memos) MUST have routes defined. Implements FR5 of refactor-task-pages, FR1, FR2 of add-memos.

#### Scenario: Clicking inbox navigates to inbox page
- **WHEN** user clicks the "inbox" filter item
- **THEN** app navigates to "/inbox"

#### Scenario: Clicking tasks navigates to active tasks page
- **WHEN** user clicks the "tasks" filter item
- **THEN** app navigates to "/tasks"

#### Scenario: Clicking completed navigates to completed page
- **WHEN** user clicks the "completed" filter item
- **THEN** app navigates to "/completed"

#### Scenario: Active mode highlighted based on current route
- **WHEN** user is on "/inbox"
- **THEN** the "inbox" filter item has `aria-pressed="true"`

#### Scenario: Clicking memos navigates to memos page
- **WHEN** user clicks the "memos" filter item
- **THEN** app navigates to "/memos"

#### Scenario: Memos mode highlighted when on memos route
- **WHEN** user is on "/memos"
- **THEN** the "memos" filter item has `aria-pressed="true"`

### Requirement: Filter items with routes navigate instead of toggling

Filter items that have a `route` property (inbox, tasks, completed, goals, ideas, contexts, categories, deleted, memos) SHALL navigate to that route when clicked, instead of toggling the mode. Only focused_goals remains without a route. Implements FR5 of refactor-task-pages, FR1, FR2 of add-memos.

#### Scenario: Clicking inbox navigates to inbox page
- **WHEN** user clicks the "inbox" filter item
- **THEN** app navigates to the inbox route "/inbox"

#### Scenario: Clicking goals navigates to goals page
- **WHEN** user clicks the "goals" filter item
- **THEN** app navigates to the goals route

#### Scenario: Clicking contexts navigates to contexts page
- **WHEN** user clicks the "contexts" filter item
- **THEN** app navigates to the contexts route

#### Scenario: Clicking memos navigates to memos page
- **WHEN** user clicks the "memos" filter item
- **THEN** app navigates to the memos route "/memos"

### Requirement: Filter items respect menu order configuration

The sidebar SHALL render only filter items marked as visible in the menu order configuration. Items SHALL appear in the order defined by the menu order.

#### Scenario: Hidden items are not rendered
- **WHEN** menu order has "categories" set to not visible
- **THEN** the "categories" filter item is NOT rendered in the sidebar

#### Scenario: Items appear in configured order
- **WHEN** menu order defines order as goals, inbox, tasks
- **THEN** filter items render in that order

### Requirement: Focused goals block renders in filter list

When the `focused_goals` menu item is visible, the sidebar SHALL render a `FocusedGoalsBlock` component in place of a regular filter button. The block SHALL show expanded content when sidebar is open and collapsed content when sidebar is collapsed.

#### Scenario: Focused goals block shown when visible in menu
- **WHEN** menu order has "focused_goals" visible
- **AND** sidebar is expanded
- **THEN** FocusedGoalsBlock renders in expanded mode

#### Scenario: Focused goals block collapsed when sidebar collapsed
- **WHEN** menu order has "focused_goals" visible
- **AND** sidebar is collapsed
- **THEN** FocusedGoalsBlock renders in collapsed mode

### Requirement: Sync button displays connection status

The sync button SHALL display different states based on connection status: synced (static icon), syncing (spinning icon), offline (icon with red error badge + "No connection" text), error (icon with red error badge + "Server error" text).

#### Scenario: Synced state shows static icon
- **WHEN** connection status is "synced"
- **THEN** sync button shows a static refresh icon

#### Scenario: Syncing state shows spinning icon
- **WHEN** connection status is "syncing"
- **THEN** sync button shows a spinning refresh icon

#### Scenario: Offline state shows error badge
- **WHEN** connection status is "offline"
- **THEN** sync button shows a red error badge
- **AND** expanded sidebar shows "No connection" text

#### Scenario: Server error state shows error badge
- **WHEN** connection status is "error"
- **THEN** sync button shows a red error badge
- **AND** expanded sidebar shows "Server error" text

### Requirement: Login button shown when backend not configured

When no backend is configured, the sidebar SHALL display a "Configure server" button that navigates to `/settings` instead of the sync button.

#### Scenario: Configure server button visible when not configured
- **WHEN** connection status is "not_configured"
- **THEN** a "Configure server" button is displayed
- **AND** sync button is NOT displayed

#### Scenario: Configure server button navigates to settings
- **WHEN** user clicks the "Configure server" button
- **THEN** app navigates to `/settings`

### Requirement: Sign-in button shown when unauthorized

When the user needs to authenticate, the sidebar SHALL display a sign-in button instead of the sync button. Clicking it SHALL invoke the sign-in flow.

#### Scenario: Sign-in button visible when unauthorized
- **WHEN** connection status is "unauthorized"
- **THEN** a sign-in button is displayed
- **AND** sync button is NOT displayed

#### Scenario: Sign-in button visible when no auth
- **WHEN** connection status is "no_auth"
- **THEN** a sign-in button is displayed

#### Scenario: Clicking sign-in invokes auth flow
- **WHEN** user clicks the sign-in button
- **THEN** the sign-in function is called

### Requirement: Account button navigates to settings

The sidebar SHALL display an account button (user avatar or default icon) that navigates to `/settings` when clicked.

#### Scenario: Account button navigates to settings
- **WHEN** user clicks the account button
- **THEN** app navigates to `/settings`

#### Scenario: Account button shows avatar when available
- **WHEN** user has a profile picture
- **THEN** account button shows the user's avatar image

### Requirement: Search button at bottom of sidebar

The sidebar SHALL render a search button at the bottom, separated by a border. Clicking it SHALL navigate to the search route.

#### Scenario: Search button navigates to search
- **WHEN** user clicks the search button
- **THEN** app navigates to the search route

### Requirement: Sidebar uses accessible markup

The sidebar filter list SHALL be wrapped in a `<nav>` element with an `aria-label`. Each filter button SHALL have an `aria-label` and `aria-pressed` attribute. The sidebar container SHALL NOT have `role="button"`, `tabIndex`, or toggle-related `aria-label` in any state. Implements NFR-A1 of improve-sidebar-ux.

#### Scenario: Nav element has aria-label
- **WHEN** sidebar is rendered
- **THEN** filter navigation is wrapped in a nav element with aria-label

#### Scenario: Filter buttons have aria-pressed
- **WHEN** sidebar is rendered with an active mode
- **THEN** the active filter button has `aria-pressed="true"`
- **AND** inactive filter buttons have `aria-pressed="false"`

#### Scenario: Sidebar container has no button role
- **WHEN** sidebar is rendered in any state
- **THEN** the sidebar container does NOT have `role="button"`
- **AND** the sidebar container does NOT have `tabIndex`
