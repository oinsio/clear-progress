Feature: Goals Search
  Implements FR7 of add-goals-specs.

  @add-goals-specs @FR7
  Scenario: Search by name
    Given goals "Learn Rust", "Learn Go", "Write book" exist
    When user searches for "learn"
    Then goals "Learn Rust" and "Learn Go" are returned

  @add-goals-specs @FR7
  Scenario: Search by description
    Given goal "Project" with description "Learn new frameworks" exists
    When user searches for "framework"
    Then goal "Project" is returned

  @add-goals-specs @FR7
  Scenario: Case-insensitive search
    Given goal "Learn RUST" exists
    When user searches for "rust"
    Then goal "Learn RUST" is returned

  @add-goals-specs @FR7
  Scenario: Results sorted by status priority then updated_at
    Given goal "A" with status "completed" updated at "2026-01-01T11:00:00.000Z" and goal "B" with status "in_progress" updated at "2026-01-01T10:00:00.000Z" exist
    When user searches for "Learn"
    Then goal "B" appears before goal "A"

  @add-goals-specs @FR7
  Scenario: Same status sorted by updated_at descending
    Given goal "A" with status "planning" updated at "2026-01-01T10:00:00.000Z" and goal "B" with status "planning" updated at "2026-01-01T11:00:00.000Z" exist
    When user searches for "Learn"
    Then goal "B" appears before goal "A"

  @add-goals-specs @FR7
  Scenario: No matches returns empty
    Given goal "Learn Rust" exists
    When user searches for "python"
    Then empty array is returned
