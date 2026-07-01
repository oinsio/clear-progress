# App Shell Navigation Spec

## Why

The app shell (AppShell, PageShell, BottomNav) and routing configuration are fully implemented but lack formal specifications and BDD tests. This creates a gap in executable documentation: navigation items, responsive layout switching, route configuration, and error boundary behavior are untested at the BDD level.

## What Changes

- ADDED: Specification for app shell navigation capability (AppShell, PageShell, BottomNav, routing)
- ADDED: BDD unit tests covering navigation items, active state, route structure, and responsive layout rules

## Goals

- G1: Document app shell navigation behavior in a formal specification
- G2: Cover BottomNav navigation items and active state with BDD unit tests
- G3: Cover routing configuration (default redirect, layout nesting) with BDD unit tests

## Non-Goals

- NG1: Do not modify existing implementation code
- NG2: Do not add E2E tests (separate change for responsive/a11y)
- NG3: Do not add sidebar navigation (not yet implemented)
- NG4: Do not specify page content — only the shell and navigation frame

## Users & Scenarios

- U1: User opens the app and is redirected to the Inbox page
- U2: User sees bottom navigation with Inbox, Today, Goals, Ideas, Search items
- U3: User navigates to a page and sees the current item highlighted in bottom nav
- U4: User encounters a route error and sees an error fallback

## Requirements

### Functional

- FR1: BottomNav SHALL render exactly five navigation items: Inbox, Today, Goals, Ideas, Search
- FR2: Each navigation item SHALL link to its corresponding route (ROUTES constant)
- FR3: The active navigation item SHALL be visually distinguished (aria-current="page")
- FR4: The root path "/" SHALL redirect to the Inbox route
- FR5: All page routes SHALL be wrapped in AppShell (AppLayout)
- FR6: Today, Week, and Later routes SHALL additionally be wrapped in PageShell (PageLayout with BottomNav)
- FR7: Route errors SHALL be caught by RouteErrorFallback (errorElement)
- FR8: BottomNav SHALL use translated labels via i18n (t("nav.*") keys)
- FR9: Each navigation item SHALL have an icon (Lucide icon) with aria-hidden="true"
- FR10: BottomNav navigation element SHALL have an aria-label from i18n

### Non-Functional

#### Accessibility
- NFR-A1: BottomNav SHALL use a `<nav>` element with a descriptive aria-label
- NFR-A2: Each nav item icon SHALL have aria-hidden="true" to avoid screen reader duplication

#### Responsive
- NFR-R1: BottomNav SHALL be visible on mobile (below md breakpoint) and hidden on desktop (md and above)

## UX Acceptance Criteria

- UX1: Navigation items appear in order: Inbox, Today, Goals, Ideas, Search
- UX2: Active page item is visually highlighted
- UX3: Navigation labels are localized

## Behavior

Reference to feature files:
- `features/app_shell/app_shell_nav_items.feature` (@app-shell-navigation-spec tags)
- `features/app_shell/app_shell_active_state.feature` (@app-shell-navigation-spec tags)
- `features/app_shell/app_shell_routing.feature` (@app-shell-navigation-spec tags)

## Affected IA

No changes.

## Success Metrics

- M1: App shell navigation spec covers FR1-FR10
- M2: BDD unit tests pass for all scenarios
- M3: Mutation score >=95% on BottomNav component (minimum acceptable >=90%)

## Capabilities

### New Capabilities
- `app-shell-navigation`: App shell layout and navigation — BottomNav items, active state, route configuration, layout nesting, error boundary

### Modified Capabilities

None.

## Impact

- New files: `openspec/specs/app-shell-navigation/spec.md`, BDD feature + steps for app shell
- Existing code is not modified
