Feature: Ideas Search
  Implements FR7 of add-ideas-specs.

  @add-ideas-specs @FR7
  Scenario: Search by name
    Given ideas "Learn Rust", "Learn Go", "Write book" exist
    When user searches for "learn"
    Then ideas "Learn Rust" and "Learn Go" are returned

  @add-ideas-specs @FR7
  Scenario: Search by description
    Given idea "Project" with description "Learn new frameworks" exists
    When user searches for "framework"
    Then idea "Project" is returned

  @add-ideas-specs @FR7
  Scenario: Case-insensitive search
    Given idea "Learn RUST" exists
    When user searches for "rust"
    Then idea "Learn RUST" is returned

  @add-ideas-specs @FR7
  Scenario: Results sorted by updated_at descending
    Given idea "A" updated at "2026-01-01T10:00:00.000Z" and idea "B" updated at "2026-01-01T11:00:00.000Z" exist
    When user searches for "Learn"
    Then idea "B" appears before idea "A"

  @add-ideas-specs @FR7
  Scenario: No matches returns empty
    Given idea "Learn Rust" exists
    When user searches for "python"
    Then empty array is returned
