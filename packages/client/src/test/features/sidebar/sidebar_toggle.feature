Feature: Sidebar Toggle
  Sidebar panel toggles between expanded and collapsed states.

  @add-sidebar-specs @FR2
  Scenario: Sidebar opens from collapsed state
    Given sidebar is collapsed
    When user clicks the collapsed strip
    Then sidebar expands to show icons and labels

  @improve-sidebar-ux @FR1
  Scenario: Sidebar closes via toggle button
    Given sidebar is expanded
    When user clicks the toggle button
    Then sidebar collapses to show icons only

  @add-sidebar-specs @FR2
  Scenario: Collapsed sidebar renders narrow strip
    Given sidebar is collapsed
    Then sidebar renders a narrow strip with icon-only buttons
    And sidebar toggle has "open" aria-label
    And sidebar toggle has role "button"

  @improve-sidebar-ux @FR1
  Scenario: Expanded sidebar container is not interactive
    Given sidebar is expanded
    Then expanded sidebar container has no role attribute
    And expanded sidebar container has no tabIndex

  @improve-sidebar-ux @FR1
  Scenario: Clicking empty area in expanded sidebar does nothing
    Given sidebar is expanded
    When user clicks the expanded container
    Then sidebar remains expanded

  @add-sidebar-specs @FR2
  Scenario: Sidebar toggle is keyboard accessible
    Given sidebar is collapsed
    Then sidebar toggle has tabIndex 0
    When user presses Enter on the toggle area
    Then sidebar expands to show icons and labels
