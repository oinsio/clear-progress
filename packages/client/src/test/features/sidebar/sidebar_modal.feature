Feature: Sidebar Modal Drawer
  Sidebar can open temporarily (modal mode) without persisting the open state.
  In modal mode, navigating via a filter item auto-collapses the sidebar.
  In standard mode (persistently open), navigation does not collapse.

  @improve-sidebar-ux @FR4
  Scenario: Modal opens without persisting
    Given sidebar is persistently closed
    When user clicks the collapsed strip
    Then sidebar opens in modal mode
    And localStorage still has panel open as false

  @improve-sidebar-ux @FR6
  Scenario: Modal closes on nav click
    Given sidebar is open in modal mode
    When user clicks a nav item
    Then sidebar collapses

  @improve-sidebar-ux @FR5
  Scenario: Standard stays open on nav click
    Given sidebar is persistently open
    When user clicks a nav item
    Then sidebar remains open
