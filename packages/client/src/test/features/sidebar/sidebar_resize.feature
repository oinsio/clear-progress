Feature: Sidebar Resize Transitions
  Sidebar state adapts when screen width crosses the breakpoint.

  @improve-sidebar-ux @FR14
  Scenario: Resize does not change saved setting
    Given sidebar mode is "expanded"
    When screen resizes from wide to narrow
    Then sidebar mode in localStorage remains "expanded"

  @improve-sidebar-ux @FR15
  Scenario: Wide to narrow closes hover overlay
    Given sidebar is hover-expanded on wide screen
    When screen resizes to narrow
    Then hover overlay closes
    And effective state is not "expanded"

  @improve-sidebar-ux @FR16
  Scenario: Narrow to wide restores saved setting
    Given sidebar mode is "expand-on-hover"
    And screen is narrow
    When screen resizes to wide
    Then effective state becomes "hover-ready"

  @improve-sidebar-ux @FR17
  Scenario: Drawer closes on resize to wide
    Given drawer is open on narrow screen
    When screen resizes to wide
    Then drawer closes
    And backdrop is removed
