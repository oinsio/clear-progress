## ADDED Requirements

### Requirement: Edge swipe opens sidebar on mobile

On mobile (below `LG_BREAKPOINT_PX`), swiping from the sidebar edge zone (~24px from screen edge) toward center SHALL open the sidebar. Swipe direction depends on `panelSide`: when sidebar is on the right, swipe left to open; when on the left, swipe right to open. The sidebar SHALL follow the finger during the swipe gesture. Implements FR8 of improve-sidebar-ux.

#### Scenario: Swipe from right edge opens right-side sidebar
- **WHEN** sidebar is collapsed
- **AND** `panelSide` is `"right"`
- **AND** user swipes left from within 24px of the right screen edge
- **THEN** sidebar opens

#### Scenario: Swipe from left edge opens left-side sidebar
- **WHEN** sidebar is collapsed
- **AND** `panelSide` is `"left"`
- **AND** user swipes right from within 24px of the left screen edge
- **THEN** sidebar opens

#### Scenario: Swipe outside edge zone does not open sidebar
- **WHEN** sidebar is collapsed
- **AND** user swipes from the center of the screen
- **THEN** sidebar remains collapsed

#### Scenario: Swipe gestures are disabled on desktop
- **WHEN** viewport is above `LG_BREAKPOINT_PX`
- **THEN** no swipe event listeners are attached

### Requirement: Swipe-back closes sidebar on mobile

On mobile, swiping an open sidebar toward its edge SHALL close it. The sidebar SHALL follow the finger during the swipe. If released before reaching 30% of sidebar width, the sidebar SHALL snap back to open position. Implements FR9 of improve-sidebar-ux.

#### Scenario: Full swipe-back closes sidebar
- **WHEN** sidebar is expanded on mobile
- **AND** user swipes the sidebar toward the screen edge past 30% threshold
- **THEN** sidebar closes

#### Scenario: Incomplete swipe-back snaps open
- **WHEN** sidebar is expanded on mobile
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
