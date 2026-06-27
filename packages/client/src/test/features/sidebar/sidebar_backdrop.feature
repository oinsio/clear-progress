Feature: Sidebar Backdrop
  On narrow screens without hover, backdrop responsibility belongs to the layout,
  not the Sidebar component itself. Sidebar never renders its own backdrop.
  Layout renders backdrop only when drawer is open on narrow + no hover.

  @improve-sidebar-ux @FR12
  Scenario: Sidebar component has no backdrop when expanded
    Given sidebar is expanded
    Then no backdrop overlay is rendered by sidebar

  @improve-sidebar-ux @FR12
  Scenario: Sidebar component has no backdrop when collapsed
    Given sidebar is collapsed
    Then no backdrop overlay is rendered by sidebar

  @improve-sidebar-ux @FR12
  Scenario: Layout has no backdrop on desktop
    Given a wide screen with hover capability
    Then no backdrop overlay is rendered by layout

  @improve-sidebar-ux @FR12
  Scenario: Layout has no backdrop when drawer is closed on narrow screen
    Given a narrow screen without hover capability
    Then no backdrop overlay is rendered by layout
