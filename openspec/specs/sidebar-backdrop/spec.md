# Capability: Sidebar Backdrop

## Purpose

Defines the backdrop overlay behavior for the sidebar drawer on narrow screens without hover capability. Provides visual separation and tap-to-close functionality.

## Requirements

### Requirement: Backdrop renders on narrow screen without hover when drawer is open

On narrow screen without hover capability (`isNarrow && !hasHover`), when the drawer is open, a backdrop overlay SHALL render behind the sidebar and in front of the main content. The backdrop SHALL have a semi-transparent dark background. On wide screen or with hover capability — no backdrop is rendered. Implements FR12, NFR-R1 of improve-sidebar-ux.

#### Scenario: Backdrop visible when drawer is open on narrow screen without hover
- **WHEN** screen is narrow and hover is not available
- **AND** drawer is open
- **THEN** a backdrop overlay is rendered

#### Scenario: Backdrop not visible on wide screen
- **WHEN** screen is wide
- **AND** sidebar is expanded
- **THEN** no backdrop overlay is rendered

#### Scenario: Backdrop not visible on narrow screen with hover
- **WHEN** screen is narrow and hover IS available
- **AND** sidebar is hover-expanded
- **THEN** no backdrop overlay is rendered

#### Scenario: Backdrop not visible when drawer is closed
- **WHEN** screen is narrow and hover is not available
- **AND** drawer is closed (sidebar collapsed)
- **THEN** no backdrop overlay is rendered

### Requirement: Tapping backdrop closes drawer

Tapping the backdrop overlay SHALL close the drawer. Implements FR12 of improve-sidebar-ux.

#### Scenario: Tap on backdrop closes drawer
- **WHEN** backdrop is visible
- **AND** user taps the backdrop
- **THEN** drawer closes
- **AND** backdrop is removed

### Requirement: Backdrop is accessible

The backdrop SHALL have an `aria-label` for screen readers. Implements NFR-A3 of improve-sidebar-ux.

#### Scenario: Backdrop has aria-label
- **WHEN** backdrop is rendered
- **THEN** backdrop element has `aria-label` with localized "Close sidebar" text
