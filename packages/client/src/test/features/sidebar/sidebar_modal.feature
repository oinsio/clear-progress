Feature: Sidebar Modal Drawer
  Sidebar can open temporarily (modal mode) without persisting the open state.
  In drawer mode (narrow + no hover), navigating via a filter item auto-collapses the drawer.
  In standard mode (persistently open), navigation does not collapse.

  @improve-sidebar-ux @FR11
  Scenario: Drawer auto-collapses on nav click
    Given sidebar is open as a drawer
    When user clicks a nav item
    Then sidebar collapses

  @improve-sidebar-ux @FR5
  Scenario: Standard stays open on nav click
    Given sidebar is persistently open
    When user clicks a nav item
    Then sidebar remains open
