Feature: Sidebar Control Popover
  User can switch sidebar behavior mode via a popover in the sidebar.

  @improve-sidebar-ux @FR2
  Scenario: Popover shows three mode options
    Given sidebar control popover is open with mode "expanded"
    Then popover displays Expanded, Collapsed, and Expand on hover options

  @improve-sidebar-ux @FR2
  Scenario: Active mode is visually indicated
    Given sidebar control popover is open with mode "collapsed"
    Then the "collapsed" option has aria-selected "true"
    And the "expanded" option has aria-selected "false"

  @improve-sidebar-ux @FR2
  Scenario: User switches sidebar mode via popover
    Given sidebar control popover is open with mode "expanded"
    When user selects the "collapsed" mode option
    Then onModeChange is called with "collapsed"
    And popover onClose is called

  @improve-sidebar-ux @FR2 @FR18
  Scenario: Sidebar control is hidden when not visible
    Given sidebar control popover is not visible
    Then sidebar control trigger is not rendered
