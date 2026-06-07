Feature: Cover + Attachment Shared File (E2E)
  When a goal cover and attachment reference the same file,
  deleting the attachment must preserve the cover image
  thanks to client-side reference counting.

  @add-file-attachments @FR7 @FR18
  Scenario: Cover image preserved when same-hash attachment is deleted
    Given user creates a goal "Shared file test"
    And user opens goal "Shared file test" in edit mode
    When user uploads test image as cover
    Then cover preview is visible
    When user switches to Attachments tab
    And user uploads test image as attachment
    Then attachment appears in the list
    When user deletes the attachment
    And user confirms deletion in dialog
    Then attachment list is empty
    And cover preview is still visible
