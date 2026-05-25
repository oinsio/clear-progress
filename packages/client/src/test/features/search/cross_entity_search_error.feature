Feature: Cross-entity search error handling
  Implements FR3 of search-specs.

  @search-specs @FR3
  Scenario: One service fails clears all results
    Given taskService.searchByName throws an error
    When user searches for "buy"
    Then tasks, goals, and ideas are all empty arrays

  @search-specs @FR3
  Scenario: Error is logged to console
    Given goalService.searchByName throws an error
    When user searches for "learn"
    Then error is logged to console

  @search-specs @FR3
  Scenario: isSearching is false after search error
    Given ideaService.searchByName throws an error
    When user searches for "test"
    Then isSearching is false
