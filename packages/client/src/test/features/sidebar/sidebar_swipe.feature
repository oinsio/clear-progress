Feature: Sidebar Swipe Gestures
  Swipe gestures to open and close the sidebar on narrow screens without hover.

  @improve-sidebar-ux @FR13 @NFR-R2
  Scenario: Edge swipe from right opens right-side sidebar
    Given user is on a narrow screen without hover with sidebar on the right
    And sidebar is closed
    When user swipes from the right edge past threshold
    Then sidebar opens

  @improve-sidebar-ux @FR13 @NFR-R2
  Scenario: Edge swipe from left opens left-side sidebar
    Given user is on a narrow screen without hover with sidebar on the left
    And sidebar is closed
    When user swipes from the left edge past threshold
    Then sidebar opens

  @improve-sidebar-ux @FR13 @NFR-R2
  Scenario: Swipe outside edge zone does not open sidebar
    Given user is on a narrow screen without hover with sidebar on the right
    And sidebar is closed
    When user swipes from outside the edge zone
    Then sidebar stays closed

  @improve-sidebar-ux @FR13
  Scenario: Full swipe-back closes sidebar
    Given user is on a narrow screen without hover with sidebar on the right
    And sidebar is open
    When user swipes the sidebar toward the right edge past threshold
    Then sidebar closes

  @improve-sidebar-ux @FR13
  Scenario: Incomplete swipe snaps back open
    Given user is on a narrow screen without hover with sidebar on the right
    And sidebar is open
    When user swipes the sidebar but releases before threshold
    Then sidebar stays open

  @improve-sidebar-ux @FR13 @NFR-R2
  Scenario: Vertical movement cancels swipe
    Given user is on a narrow screen without hover with sidebar on the right
    And sidebar is closed
    When user scrolls vertically from the edge zone
    Then sidebar stays closed

  @improve-sidebar-ux @FR13 @NFR-R2
  Scenario: Wide screen or hover-capable has no swipe listeners
    Given user is on a wide screen or has hover capability
    And sidebar is closed on the right
    When user touches near the right edge
    Then sidebar stays closed
