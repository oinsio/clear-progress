Feature: AttachmentService CRUD
  Implements FR5, FR8, FR13 of add-file-attachments.

  @add-file-attachments @FR8
  Scenario: Attach a file to a task
    Given a FileService that returns hash "abc123" on upload
    And no existing attachments for task "task-1"
    When attachFile is called with a 1KB "report.pdf" for task "task-1"
    Then an attachment record is saved with hash "abc123", filename "report.pdf", sort_order 0
    And the attachment is marked as needsSync true

  @add-file-attachments @FR8
  Scenario: Sort order increments for subsequent attachments
    Given a FileService that returns hash "def456" on upload
    And 2 existing attachments for task "task-1"
    When attachFile is called with a 2KB "image.jpg" for task "task-1"
    Then the new attachment has sort_order 2

  @add-file-attachments @FR8
  Scenario: File upload uses MAX_ATTACHMENT_SIZE_BYTES limit
    Given a FileService that tracks upload arguments
    When attachFile is called with a file for goal "goal-1"
    Then FileService.uploadFile was called with empty goalId and MAX_ATTACHMENT_SIZE_BYTES

  @add-file-attachments @FR13
  Scenario: Delete an attachment
    Given an attachment "att-1" exists
    When deleteAttachment is called with "att-1"
    Then attachmentRepository.delete was called with "att-1"

  @add-file-attachments @FR5
  Scenario: Get attachments for an entity
    Given 3 attachments exist for goal "goal-1"
    When getAttachments is called for goal "goal-1"
    Then 3 attachments are returned
