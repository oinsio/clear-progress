Feature: Sidebar Backdrop
  A backdrop overlay appears on mobile when the sidebar is expanded,
  allowing the user to dismiss it by tapping outside.

  @improve-sidebar-ux @FR3
  Scenario: Backdrop visible on mobile when sidebar expanded
    Given user is on mobile
    And sidebar is open
    Then a backdrop overlay is visible

  @improve-sidebar-ux @FR3
  Scenario: Backdrop not visible on desktop
    Given user is on desktop
    And sidebar is open
    Then no backdrop overlay is visible

  @improve-sidebar-ux @FR3
  Scenario: Tap on backdrop closes sidebar
    Given user is on mobile
    And sidebar is open
    When user taps the backdrop
    Then sidebar closes
