Feature: Cross-entity search
  Implements FR1, FR2 of search-specs.

  @search-specs @FR1
  Scenario: Search returns results from all entity types
    Given tasks, goals, and ideas matching "learn" exist
    When user searches for "learn"
    Then results contain matching tasks, goals, and ideas

  @search-specs @FR1
  Scenario: Search returns partial results
    Given only tasks matching "buy" exist
    When user searches for "buy"
    Then tasks contain matches
    And goals are empty
    And ideas are empty

  @search-specs @FR1
  Scenario: All services called with same query
    When user searches for "meeting"
    Then taskService.searchByName is called with "meeting"
    And goalService.searchByName is called with "meeting"
    And ideaService.searchByName is called with "meeting"

  @search-specs @FR2
  Scenario: Empty query clears all results
    Given previous search returned results
    When user searches with empty string
    Then tasks, goals, and ideas are all empty arrays
    And no service searchByName methods are called
