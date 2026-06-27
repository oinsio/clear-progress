Feature: Sidebar Hover Expand
  Sidebar expands as overlay on hover when in hover-ready state.

  @improve-sidebar-ux @FR5
  Scenario: Hover expands sidebar after debounce
    Given hover-ready sidebar expands after 250ms debounce

  @improve-sidebar-ux @FR5
  Scenario: Brief hover does not expand sidebar
    Given hover-ready sidebar stays collapsed when mouse leaves before 250ms

  @improve-sidebar-ux @FR5
  Scenario: Mouse leave collapses hover-expanded sidebar
    Given hover-expanded sidebar collapses after 150ms mouse leave

  @improve-sidebar-ux @FR5
  Scenario: Brief mouse leave does not collapse
    Given hover-expanded sidebar stays expanded when mouse returns within 150ms

  @improve-sidebar-ux @FR6
  Scenario: Navigation click in hover-expanded does not collapse
    Given hover-expanded sidebar stays rendered after navigation click

  @improve-sidebar-ux @FR5
  Scenario: Hover does not activate when not hover-ready
    Given expanded sidebar ignores hover events
