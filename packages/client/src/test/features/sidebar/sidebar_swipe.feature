Feature: Sidebar Swipe Gestures
  Swipe gestures on mobile to open and close the sidebar.

  @improve-sidebar-ux @FR8 @NFR-R2
  Scenario: Edge swipe from right opens right-side sidebar
    Given user is on mobile with sidebar on the right
    And sidebar is closed
    When user swipes from the right edge past threshold
    Then sidebar opens

  @improve-sidebar-ux @FR8 @NFR-R2
  Scenario: Edge swipe from left opens left-side sidebar
    Given user is on mobile with sidebar on the left
    And sidebar is closed
    When user swipes from the left edge past threshold
    Then sidebar opens

  @improve-sidebar-ux @FR8 @NFR-R2
  Scenario: Swipe outside edge zone does not open sidebar
    Given user is on mobile with sidebar on the right
    And sidebar is closed
    When user swipes from outside the edge zone
    Then sidebar stays closed

  @improve-sidebar-ux @FR9
  Scenario: Full swipe-back closes sidebar
    Given user is on mobile with sidebar on the right
    And sidebar is open
    When user swipes the sidebar toward the right edge past threshold
    Then sidebar closes

  @improve-sidebar-ux @FR9
  Scenario: Incomplete swipe snaps back open
    Given user is on mobile with sidebar on the right
    And sidebar is open
    When user swipes the sidebar but releases before threshold
    Then sidebar stays open

  @improve-sidebar-ux @FR8 @FR9 @NFR-R2
  Scenario: Vertical movement cancels swipe
    Given user is on mobile with sidebar on the right
    And sidebar is closed
    When user scrolls vertically from the edge zone
    Then sidebar stays closed

  @improve-sidebar-ux @FR8 @FR9 @NFR-R2
  Scenario: Desktop has no swipe listeners
    Given user is on desktop
    And sidebar is closed on the right
    When user touches near the right edge
    Then sidebar stays closed
