## ADDED Requirements

### Requirement: Newline preservation in LinkedText

LinkedText SHALL preserve newline characters (`\n`) in rendered text by applying `white-space: pre-line` CSS property to its root element. This ensures user-entered line breaks are visible in view mode. Implements FR1, FR2, FR3 of fix-newline-display.

#### Scenario: Text with newlines displays line breaks
- **WHEN** LinkedText is rendered with text "Line one\nLine two"
- **THEN** the root element has CSS class `whitespace-pre-line`

#### Scenario: Newlines preserved alongside URL detection
- **WHEN** LinkedText is rendered with text "Before\nhttps://example.com\nAfter"
- **THEN** the root element has CSS class `whitespace-pre-line`
- **THEN** the URL is still rendered as a clickable link
