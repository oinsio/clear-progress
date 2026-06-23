# Capability: Error Fallback

## Purpose

Error boundary UI components for graceful error recovery. ErrorFallback displays a user-friendly error screen with reload action. RouteErrorFallback wraps it for React Router error boundaries.

## ADDED Requirements

### Requirement: ErrorFallback displays localized error message with reload action

ErrorFallback SHALL render a full-screen centered layout containing: a localized heading (`error.title`), a localized description (`error.description`), and a reload button (`error.reload`). Clicking the reload button SHALL trigger `window.location.reload()`. Implements FR1, FR2, UX1 of miss-ui-specs.

#### Scenario: Error screen displays localized content

- **WHEN** ErrorFallback is rendered
- **THEN** a heading with translated `error.title` text is visible
- **AND** a description with translated `error.description` text is visible
- **AND** a reload button with translated `error.reload` text is visible

#### Scenario: Reload button reloads the page

- **WHEN** user clicks the reload button
- **THEN** `window.location.reload()` is called

#### Scenario: Layout is centered on full screen

- **WHEN** ErrorFallback is rendered
- **THEN** content is centered vertically and horizontally within a min-height screen container

### Requirement: RouteErrorFallback wraps ErrorFallback for React Router

RouteErrorFallback SHALL call `useRouteError()` to capture the route error, log it to console via `console.error`, and render `ErrorFallback`. Implements FR3 of miss-ui-specs.

#### Scenario: Route error is logged and ErrorFallback is rendered

- **WHEN** a route error occurs and RouteErrorFallback is rendered
- **THEN** the error is logged to console
- **AND** ErrorFallback is displayed
