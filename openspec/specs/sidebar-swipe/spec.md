# Capability: Sidebar Swipe

## Purpose

Defines swipe gesture behavior for opening and closing the sidebar drawer on narrow screens without hover capability. Supports edge detection, finger tracking, and directional swipe based on panel side.

## Requirements

### Requirement: Edge swipe opens drawer on narrow screen without hover

On narrow screen without hover capability (`isNarrow && !hasHover`), swiping from the sidebar edge zone (~24px from screen edge) toward center SHALL open the drawer. Swipe direction depends on `panelSide`: when sidebar is on the right, swipe left to open; when on the left, swipe right to open. The sidebar SHALL follow the finger during the swipe gesture. Swipe gestures SHALL NOT be active when hover capability is available. Implements FR13, NFR-R2 of improve-sidebar-ux.

#### Scenario: Swipe from right edge opens right-side sidebar
- **WHEN** screen is narrow and hover is not available
- **AND** sidebar is collapsed
- **AND** `panelSide` is `"right"`
- **AND** user swipes left from within 24px of the right screen edge
- **THEN** drawer opens

#### Scenario: Swipe from left edge opens left-side sidebar
- **WHEN** screen is narrow and hover is not available
- **AND** sidebar is collapsed
- **AND** `panelSide` is `"left"`
- **AND** user swipes right from within 24px of the left screen edge
- **THEN** drawer opens

#### Scenario: Swipe outside edge zone does not open sidebar
- **WHEN** screen is narrow and hover is not available
- **AND** sidebar is collapsed
- **AND** user swipes from the center of the screen
- **THEN** sidebar remains collapsed

#### Scenario: Swipe gestures disabled when hover is available
- **WHEN** screen is narrow and hover IS available
- **THEN** no swipe event listeners are attached

#### Scenario: Swipe gestures disabled on wide screen
- **WHEN** screen is wide
- **THEN** no swipe event listeners are attached

### Requirement: Swipe-back closes drawer on narrow screen without hover

On narrow screen without hover, swiping an open drawer toward its edge SHALL close it. The sidebar SHALL follow the finger during the swipe. If released before reaching 30% of sidebar width, the sidebar SHALL snap back to open position. Implements FR13 of improve-sidebar-ux.

#### Scenario: Full swipe-back closes drawer
- **WHEN** drawer is open on narrow screen without hover
- **AND** user swipes the sidebar toward the screen edge past 30% threshold
- **THEN** drawer closes

#### Scenario: Incomplete swipe-back snaps open
- **WHEN** drawer is open on narrow screen without hover
- **AND** user swipes the sidebar toward the screen edge but releases before 30% threshold
- **THEN** sidebar snaps back to fully open position

#### Scenario: Sidebar follows finger during swipe
- **WHEN** user is swiping the sidebar
- **THEN** the sidebar position SHALL track the touch position via CSS transform

### Requirement: Vertical scroll cancels swipe gesture

If vertical touch movement exceeds horizontal movement during the initial gesture detection phase, the swipe SHALL be cancelled to allow normal page scrolling.

#### Scenario: Vertical movement cancels swipe
- **WHEN** user touches the sidebar edge zone
- **AND** vertical movement exceeds horizontal movement
- **THEN** swipe gesture is cancelled
- **AND** normal page scrolling occurs
