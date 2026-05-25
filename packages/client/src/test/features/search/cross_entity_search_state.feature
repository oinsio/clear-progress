Feature: Cross-entity search state management
  Implements FR4, FR5 of search-specs.

  @search-specs @FR5
  Scenario: Initial state
    When useSearch is initialized
    Then isSearching is false
    And tasks, goals, and ideas are all empty arrays

  @search-specs @FR5
  Scenario: isSearching is false after search completes
    When user searches for "learn" and search completes
    Then isSearching is false

  @search-specs @FR4
  Scenario: Clear resets all results
    Given previous search returned results
    When user calls clear
    Then tasks, goals, and ideas are all empty arrays
