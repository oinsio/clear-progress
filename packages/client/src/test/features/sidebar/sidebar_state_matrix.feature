Feature: Sidebar State Resolution Matrix
  The effective sidebar state is resolved from three factors:
  screen width (narrow/wide), hover capability, and user preference.

  @improve-sidebar-ux @FR8
  Scenario: Wide screen with hover and expanded mode
    Given the screen is wide
    And the device supports hover
    And the sidebar mode is "expanded"
    When the sidebar state is resolved
    Then the effective state is "expanded"

  @improve-sidebar-ux @FR8
  Scenario: Wide screen with hover and collapsed mode
    Given the screen is wide
    And the device supports hover
    And the sidebar mode is "collapsed"
    When the sidebar state is resolved
    Then the effective state is "collapsed"

  @improve-sidebar-ux @FR8
  Scenario: Wide screen with hover and expand-on-hover mode
    Given the screen is wide
    And the device supports hover
    And the sidebar mode is "expand-on-hover"
    When the sidebar state is resolved
    Then the effective state is "hover-ready"

  @improve-sidebar-ux @FR8
  Scenario: Wide screen without hover and expanded mode
    Given the screen is wide
    And the device does not support hover
    And the sidebar mode is "expanded"
    When the sidebar state is resolved
    Then the effective state is "expanded"

  @improve-sidebar-ux @FR8
  Scenario: Wide screen without hover and collapsed mode
    Given the screen is wide
    And the device does not support hover
    And the sidebar mode is "collapsed"
    When the sidebar state is resolved
    Then the effective state is "collapsed"

  @improve-sidebar-ux @FR8
  Scenario: Wide screen without hover and expand-on-hover falls back to collapsed
    Given the screen is wide
    And the device does not support hover
    And the sidebar mode is "expand-on-hover"
    When the sidebar state is resolved
    Then the effective state is "collapsed"

  @improve-sidebar-ux @FR8
  Scenario: Narrow screen with hover and expanded mode compromises to hover-ready
    Given the screen is narrow
    And the device supports hover
    And the sidebar mode is "expanded"
    When the sidebar state is resolved
    Then the effective state is "hover-ready"

  @improve-sidebar-ux @FR8
  Scenario: Narrow screen with hover and collapsed mode
    Given the screen is narrow
    And the device supports hover
    And the sidebar mode is "collapsed"
    When the sidebar state is resolved
    Then the effective state is "collapsed"

  @improve-sidebar-ux @FR8
  Scenario: Narrow screen with hover and expand-on-hover mode
    Given the screen is narrow
    And the device supports hover
    And the sidebar mode is "expand-on-hover"
    When the sidebar state is resolved
    Then the effective state is "hover-ready"

  @improve-sidebar-ux @FR8
  Scenario: Narrow screen without hover and expanded mode falls back to collapsed
    Given the screen is narrow
    And the device does not support hover
    And the sidebar mode is "expanded"
    When the sidebar state is resolved
    Then the effective state is "collapsed"

  @improve-sidebar-ux @FR8
  Scenario: Narrow screen without hover and collapsed mode
    Given the screen is narrow
    And the device does not support hover
    And the sidebar mode is "collapsed"
    When the sidebar state is resolved
    Then the effective state is "collapsed"

  @improve-sidebar-ux @FR8
  Scenario: Narrow screen without hover and expand-on-hover falls back to collapsed
    Given the screen is narrow
    And the device does not support hover
    And the sidebar mode is "expand-on-hover"
    When the sidebar state is resolved
    Then the effective state is "collapsed"
