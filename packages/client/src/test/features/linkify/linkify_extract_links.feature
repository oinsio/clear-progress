Feature: URL extraction from text
  Implements FR1-FR8 of linkify-spec.

  @linkify-spec @FR1
  Scenario: Empty string produces no segments
    When extractLinks is called with ""
    Then the result is an empty array

  @linkify-spec @FR2
  Scenario: Text without URLs is a single text segment
    When extractLinks is called with "Just plain text without links"
    Then the result contains 1 segment
    And segment 1 has type "text" and value "Just plain text without links"

  @linkify-spec @FR3
  Scenario: HTTP URL is detected
    When extractLinks is called with "Visit http://example.com"
    Then the result contains a URL segment with value "http://example.com"

  @linkify-spec @FR4
  Scenario: HTTPS URL is detected
    When extractLinks is called with "Visit https://example.com"
    Then the result contains a URL segment with value "https://example.com"

  @linkify-spec @FR5
  Scenario: URL at start of text
    When extractLinks is called with "https://example.com is the link"
    Then segment 1 has type "url" and value "https://example.com"
    And segment 2 has type "text" and value " is the link"

  @linkify-spec @FR5
  Scenario: URL in middle of text
    When extractLinks is called with "Before https://example.com after"
    Then segment 1 has type "text" and value "Before "
    And segment 2 has type "url" and value "https://example.com"
    And segment 3 has type "text" and value " after"

  @linkify-spec @FR5
  Scenario: URL at end of text
    When extractLinks is called with "The link is https://example.com"
    Then segment 1 has type "text" and value "The link is "
    And segment 2 has type "url" and value "https://example.com"

  @linkify-spec @FR6
  Scenario: Multiple URLs are extracted
    When extractLinks is called with "Visit https://example.com and https://test.org"
    Then the result contains 4 segments
    And segment 2 has type "url" and value "https://example.com"
    And segment 4 has type "url" and value "https://test.org"

  @linkify-spec @FR7
  Scenario: URL with query parameters preserves them
    When extractLinks is called with "Translate https://translate.google.com/?hl=ru&sl=en here"
    Then the result contains a URL segment with value "https://translate.google.com/?hl=ru&sl=en"

  @linkify-spec @FR8
  Scenario: Trailing period is stripped from URL
    When extractLinks is called with "See https://example.com."
    Then the result contains a URL segment with value "https://example.com"

  @linkify-spec @FR8
  Scenario: Trailing comma is stripped from URL
    When extractLinks is called with "Also https://test.org, and more"
    Then the result contains a URL segment with value "https://test.org"

  @linkify-spec @FR8
  Scenario: Trailing closing parenthesis is stripped from URL
    When extractLinks is called with text containing a URL followed by closing parenthesis
    Then the result contains a URL segment with value "https://foo.bar"
