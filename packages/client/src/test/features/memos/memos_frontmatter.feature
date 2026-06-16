Feature: Frontmatter validation
  Implements FR10 of add-memos.

  @add-memos @FR10
  Scenario: Valid frontmatter parsed correctly
    Given a memo with valid frontmatter
    When the frontmatter is parsed
    Then all attributes are extracted
    And the body content is extracted

  @add-memos @FR10
  Scenario: Missing frontmatter delimiters returns null
    Given a memo without frontmatter delimiters
    When the frontmatter is parsed
    Then null is returned

  @add-memos @FR10
  Scenario: Missing required field returns null
    Given a memo with missing title field
    When the frontmatter is parsed
    Then null is returned

  @add-memos @FR10
  Scenario: Non-integer order field returns null
    Given a memo with non-integer order field
    When the frontmatter is parsed
    Then null is returned
