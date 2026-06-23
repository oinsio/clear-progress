Feature: GoalCoverPicker Interaction
  GoalCoverPicker handles file selection, input reset, and remove actions.

  @miss-ui-specs @FR5
  Scenario: File picker opens on button click
    When user clicks the cover picker button
    Then the hidden file input click is triggered

  @miss-ui-specs @FR6
  Scenario: File selection triggers callback
    When user selects an image file via the file picker
    Then onFileSelect is called with the selected file

  @miss-ui-specs @FR6
  Scenario: No callback when no file selected
    When file picker change fires with no files
    Then onFileSelect is not called

  @miss-ui-specs @FR8
  Scenario: Input reset after file selection
    When user selects an image file via the file picker
    Then the file input value is reset to empty string

  @miss-ui-specs @FR5
  Scenario: Remove button calls onRemove
    Given GoalCoverPicker has a preview image
    When user clicks the remove button
    Then onRemove callback is called
