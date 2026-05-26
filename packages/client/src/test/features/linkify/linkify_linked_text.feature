Feature: LinkedText component rendering
  Implements FR16-FR22 of linkify-spec.

  @linkify-spec @FR16
  Scenario: Text without URLs renders as plain text
    When LinkedText is rendered with text "Just plain text"
    Then the text "Just plain text" is visible
    And no link elements are present

  @linkify-spec @FR17
  Scenario: URL renders as anchor with security attributes
    When LinkedText is rendered with text "Visit https://example.com for details"
    Then a link element is present with href "https://example.com"
    And the link has target "_blank"
    And the link has rel "noopener noreferrer"

  @linkify-spec @FR17
  Scenario: Multiple URLs render as separate links
    When LinkedText is rendered with text "Visit https://example.com and https://test.org"
    Then 2 link elements are present
    And link 1 has href "https://example.com"
    And link 2 has href "https://test.org"

  @linkify-spec @FR18
  Scenario: Long URL is displayed with shortened text
    When LinkedText is rendered with text "Visit https://www.example.com/very/long/path"
    Then the link text content includes "example.com/very/…/path"

  @linkify-spec @FR19
  Scenario: Full URL is shown in title attribute
    When LinkedText is rendered with text "Visit https://example.com/path"
    Then the link has title attribute "https://example.com/path"

  @linkify-spec @FR20
  Scenario: Link click does not propagate to parent
    Given a LinkedText with text "Visit https://example.com" inside a clickable parent
    When the link is clicked
    Then the parent onClick handler is not called

  @linkify-spec @FR21
  Scenario: Empty text renders an empty element
    When LinkedText is rendered with text ""
    Then the rendered element is empty

  @linkify-spec @FR22
  Scenario: Custom className is applied to root element
    When LinkedText is rendered with text "Plain text" and className "custom-class"
    Then the root element has class "custom-class"
