Feature: Sidebar Toggle
  Sidebar panel toggles between expanded and collapsed states.

  @improve-sidebar-ux @FR4
  Scenario: Collapsed sidebar renders narrow strip
    Given sidebar is collapsed
    Then sidebar renders a narrow strip with icon-only buttons

  @improve-sidebar-ux @FR4
  Scenario: Collapsed sidebar is not interactive as a whole
    Given sidebar is collapsed
    Then collapsed sidebar has no role attribute
    And collapsed sidebar has no tabIndex
    And collapsed sidebar has no cursor-pointer

  @improve-sidebar-ux @FR4
  Scenario: Expanded sidebar container is not interactive
    Given sidebar is expanded
    Then expanded sidebar container has no role attribute
    And expanded sidebar container has no tabIndex

  @improve-sidebar-ux @FR4
  Scenario: Clicking empty area in expanded sidebar does nothing
    Given sidebar is expanded
    When user clicks the expanded container
    Then no navigation or toggle occurs

  @improve-sidebar-ux @FR4
  Scenario: Expanded sidebar has no backdrop
    Given sidebar is expanded
    Then no backdrop overlay is rendered
