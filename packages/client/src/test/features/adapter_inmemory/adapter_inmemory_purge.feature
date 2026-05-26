Feature: In-memory adapter purge
  Implements FR11 of adapter-inmemory-spec.

  @adapter-inmemory-spec @FR11
  Scenario: Soft-deleted entities are removed
    Given an initialized adapter
    And a deleted task and a non-deleted task exist
    When purge is called
    Then the purge response reports 1 task purged
    And only the non-deleted task remains in pull

  @adapter-inmemory-spec @FR11
  Scenario: Purge increments purge_revision
    Given an initialized adapter
    When purge is called twice
    Then the first purge has purge_revision 1 and the second has purge_revision 2

  @adapter-inmemory-spec @FR11
  Scenario: Purge across all entity types
    Given an initialized adapter
    And one soft-deleted entity of each type exists
    When purge is called
    Then each entity type reports 1 purged item
