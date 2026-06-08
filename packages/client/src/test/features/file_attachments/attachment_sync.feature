Feature: Attachment Sync
  Implements FR6 of add-file-attachments.
  Verifies that attachments are included in push/pull sync protocol.

  @add-file-attachments @FR6
  Scenario: Dirty attachments are included in push request
    Given client has 2 dirty attachments
    When push is called
    Then the push request contains 2 attachments

  @add-file-attachments @FR6
  Scenario: Push results clear needsSync on accepted attachments
    Given client has 1 dirty attachment with id "att-1"
    And server accepts the attachment with revision 5
    When push is called
    Then attachment "att-1" has needsSync false and revision 5

  @add-file-attachments @FR6
  Scenario: Pull response attachments are applied to local DB
    Given server returns 3 attachments in pull response
    When pull is called
    Then attachmentRepository.applyServerRecords is called with 3 attachments
