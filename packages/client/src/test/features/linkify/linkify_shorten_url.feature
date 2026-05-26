Feature: URL shortening for display
  Implements FR9-FR15 of linkify-spec.

  @linkify-spec @FR9
  Scenario: www prefix is removed from hostname
    When shortenUrl is called with "https://www.example.com/path"
    Then the shortened result is "example.com/path"

  @linkify-spec @FR10
  Scenario: Trailing slash is removed from path
    When shortenUrl is called with "https://example.com/path/"
    Then the shortened result is "example.com/path"

  @linkify-spec @FR11
  Scenario: Three-segment path is abbreviated with ellipsis
    When shortenUrl is called with "https://example.com/first/middle/last"
    Then the shortened result is "example.com/first/…/last"

  @linkify-spec @FR11
  Scenario: Four-segment path with query and hash is abbreviated
    When shortenUrl is called with "https://www.example.com/a/b/c/d?foo=bar#section"
    Then the shortened result is "example.com/a/…/d"

  @linkify-spec @FR12
  Scenario: Single-segment path is kept intact
    When shortenUrl is called with "https://example.com/path"
    Then the shortened result is "example.com/path"

  @linkify-spec @FR12
  Scenario: Two-segment path is kept intact
    When shortenUrl is called with "https://example.com/first/second"
    Then the shortened result is "example.com/first/second"

  @linkify-spec @FR13
  Scenario: Query parameters are omitted from display
    When shortenUrl is called with "https://example.com/path?foo=bar&baz=qux"
    Then the shortened result is "example.com/path"

  @linkify-spec @FR13
  Scenario: Hash fragment is omitted from display
    When shortenUrl is called with "https://example.com/path#section"
    Then the shortened result is "example.com/path"

  @linkify-spec @FR14
  Scenario: URL without path shows hostname only
    When shortenUrl is called with "https://example.com"
    Then the shortened result is "example.com"

  @linkify-spec @FR14
  Scenario: URL with only trailing slash shows hostname only
    When shortenUrl is called with "https://example.com/"
    Then the shortened result is "example.com"

  @linkify-spec @FR15
  Scenario: Invalid URL falls back to removing protocol
    When shortenUrl is called with "not-a-valid-url"
    Then the shortened result is "not-a-valid-url"
