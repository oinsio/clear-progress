## ADDED Requirements

### Requirement: Backdrop renders on mobile when sidebar is expanded

On mobile (below `LG_BREAKPOINT_PX`), when the sidebar is expanded, a backdrop overlay SHALL render behind the sidebar and in front of the main content. The backdrop SHALL have a semi-transparent dark background. Implements FR3 of improve-sidebar-ux.

#### Scenario: Backdrop visible on mobile with expanded sidebar
- **WHEN** viewport is below `LG_BREAKPOINT_PX`
- **AND** sidebar is expanded
- **THEN** a backdrop overlay is rendered

#### Scenario: Backdrop not visible on desktop
- **WHEN** viewport is above `LG_BREAKPOINT_PX`
- **AND** sidebar is expanded
- **THEN** no backdrop overlay is rendered

#### Scenario: Backdrop not visible when sidebar is collapsed
- **WHEN** viewport is below `LG_BREAKPOINT_PX`
- **AND** sidebar is collapsed
- **THEN** no backdrop overlay is rendered

### Requirement: Tapping backdrop closes sidebar

Tapping the backdrop overlay SHALL close the sidebar. Implements FR3 of improve-sidebar-ux.

#### Scenario: Tap on backdrop closes sidebar
- **WHEN** backdrop is visible
- **AND** user taps the backdrop
- **THEN** sidebar closes
- **AND** backdrop is removed

### Requirement: Backdrop is accessible

The backdrop SHALL have an `aria-label` for screen readers. Implements NFR-A2 of improve-sidebar-ux.

#### Scenario: Backdrop has aria-label
- **WHEN** backdrop is rendered
- **THEN** backdrop element has `aria-label` with localized "Close sidebar" text
