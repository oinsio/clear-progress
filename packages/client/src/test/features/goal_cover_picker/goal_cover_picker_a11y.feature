Feature: GoalCoverPicker Accessibility
  GoalCoverPicker provides correct accessibility attributes for screen readers.

  @miss-ui-specs @NFR-A2
  Scenario: Picker button has aria-label
    When GoalCoverPicker is rendered
    Then the picker button has aria-label "goal.cover.choose"

  @miss-ui-specs @NFR-A2
  Scenario: Default SVG placeholder is decorative
    When GoalCoverPicker is rendered with no preview
    Then the default image has aria-hidden "true"
    And the default image has empty alt text

  @miss-ui-specs @NFR-A2
  Scenario: Remove button has aria-label
    When GoalCoverPicker is rendered with a preview image
    Then the remove button has aria-label "goal.cover.remove"

  @miss-ui-specs @NFR-A2
  Scenario: X icon is decorative
    When GoalCoverPicker is rendered with a preview image
    Then the X icon SVG has aria-hidden "true"
