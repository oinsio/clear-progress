Feature: GoalCoverPicker Display
  GoalCoverPicker displays a cover preview or default placeholder, and shows a remove button when a cover is present.

  @miss-ui-specs @FR4
  Scenario: Default cover shown when no preview
    When GoalCoverPicker is rendered with no previewSrc
    Then the default SVG placeholder is displayed
    And no preview image is visible

  @miss-ui-specs @FR4
  Scenario: Preview image shown when previewSrc provided
    When GoalCoverPicker is rendered with previewSrc "https://example.com/cover.jpg"
    Then the preview image is displayed with src "https://example.com/cover.jpg"
    And no default SVG placeholder is visible

  @miss-ui-specs @FR7
  Scenario: Remove button hidden when no cover
    When GoalCoverPicker is rendered with no previewSrc
    Then no remove button is visible

  @miss-ui-specs @FR7
  Scenario: Remove button visible when cover is present
    When GoalCoverPicker is rendered with previewSrc "https://example.com/cover.jpg"
    Then the remove button is visible
