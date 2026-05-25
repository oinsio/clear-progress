Feature: Google Sheets Meta sheet operations
  Implements FR11 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR11
  Scenario: initMetaSheet creates sheet with default values
    Given no Meta sheet exists
    When initializing the Meta sheet
    Then Meta sheet is created with header row
    And next_revision row is added with default value 1
    And purge_revision row is added with default value 0

  @gas-adapter-specs-and-bdd @FR11
  Scenario: initMetaSheet is idempotent when sheet exists
    Given Meta sheet already exists
    When initializing the Meta sheet
    Then no new sheet is created

  @gas-adapter-specs-and-bdd @FR11
  Scenario: readNextRevision returns stored value
    Given Meta sheet contains next_revision with value 5
    When reading next revision
    Then revision value is 5

  @gas-adapter-specs-and-bdd @FR11
  Scenario: readNextRevision returns default when key is missing
    Given Meta sheet has no next_revision row
    When reading next revision
    Then revision value is 1

  @gas-adapter-specs-and-bdd @FR11
  Scenario: saveNextRevision updates existing value
    Given Meta sheet contains next_revision with value 3
    When saving next revision with value 10
    Then setValues is called with next_revision and 10

  @gas-adapter-specs-and-bdd @FR11
  Scenario: saveNextRevision appends when key is missing
    Given Meta sheet has no next_revision row
    When saving next revision with value 7
    Then appendRow is called with next_revision and 7

  @gas-adapter-specs-and-bdd @FR11
  Scenario: readPurgeRevision returns stored value
    Given Meta sheet contains purge_revision with value 4
    When reading purge revision
    Then purge revision value is 4

  @gas-adapter-specs-and-bdd @FR11
  Scenario: readPurgeRevision returns default when key is missing
    Given Meta sheet has no purge_revision row
    When reading purge revision
    Then purge revision value is 0

  @gas-adapter-specs-and-bdd @FR11
  Scenario: savePurgeRevision updates existing value
    Given Meta sheet contains purge_revision with value 2
    When saving purge revision with value 8
    Then setValues is called with purge_revision and 8
