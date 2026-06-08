Feature: Cascading delete and restore of attachments
  Implements FR14, FR15 of add-file-attachments.

  @add-file-attachments @FR14
  Scenario: Deleting a task cascades soft-delete to its attachments
    Given a task "task-1" exists
    When the task "task-1" is soft-deleted
    Then attachmentRepository.softDeleteByEntityTypeAndId is called with "task" and "task-1"

  @add-file-attachments @FR15
  Scenario: Restoring a task cascades restore to its attachments
    Given a task "task-1" exists
    When the task "task-1" is restored
    Then attachmentRepository.restoreByEntityTypeAndId is called with "task" and "task-1"

  @add-file-attachments @FR14
  Scenario: Deleting a goal cascades soft-delete to its attachments
    Given a goal "goal-1" exists
    When the goal "goal-1" is soft-deleted
    Then attachmentRepository.softDeleteByEntityTypeAndId is called with "goal" and "goal-1"

  @add-file-attachments @FR15
  Scenario: Restoring a goal cascades restore to its attachments
    Given a goal "goal-1" exists
    When the goal "goal-1" is restored
    Then attachmentRepository.restoreByEntityTypeAndId is called with "goal" and "goal-1"

  @add-file-attachments @FR14
  Scenario: Deleting an idea cascades soft-delete to its attachments
    Given an idea "idea-1" exists
    When the idea "idea-1" is soft-deleted
    Then attachmentRepository.softDeleteByEntityTypeAndId is called with "idea" and "idea-1"

  @add-file-attachments @FR15
  Scenario: Restoring an idea cascades restore to its attachments
    Given an idea "idea-1" exists
    When the idea "idea-1" is restored
    Then attachmentRepository.restoreByEntityTypeAndId is called with "idea" and "idea-1"
