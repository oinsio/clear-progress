Feature: CommandBar filter section
  Implements FR5, FR6, FR8, FR9 of command-bar.

  Background:
    Given CommandBar is rendered with filter config
    And active box is "today"

  @command-bar @FR5 @FR6
  Scenario: Filter collapsed shows active box icon and chevron
    Then collapsed filter shows the active box icon
    And collapsed filter shows a chevron indicator

  @command-bar @FR6
  Scenario: Filter expands on tap showing all box icons
    When user taps the collapsed filter
    Then filter expands to show all box icons

  @command-bar @FR9
  Scenario: Selecting a box collapses filter and calls onBoxChange
    Given filter is expanded
    When user selects "week" box
    Then filter collapses
    And onBoxChange is called with "week"

  @command-bar @FR8
  Scenario: Textarea focus collapses expanded filter
    Given filter is expanded
    When user focuses the textarea
    Then filter collapses
    And active box value is preserved

  @command-bar @FR8
  Scenario: Outside click collapses expanded filter
    Given filter is expanded
    When user clicks outside the filter
    Then filter collapses

  @command-bar @FR5
  Scenario: No filter section when filter prop is undefined
    Given CommandBar is rendered without filter config
    Then no filter section is rendered
