# Linkify — Delta Spec

## MODIFIED Requirements

### Requirement: Newline preservation in LinkedText

LinkedText SHALL preserve newline characters (`\n`) in rendered text by applying `white-space: pre-line` CSS property to its root element. This ensures user-entered line breaks are visible in view mode. Implements FR1, FR2, FR3 of fix-newline-display.

LinkedText is no longer used for entity description fields (Task, Goal, Idea). Description fields use `DescriptionMarkdown` component with markdown rendering and `remark-gfm` autolink instead of `extractLinks`. LinkedText remains available for other use cases where plain text with link detection is needed (e.g., entity names). Implements FR8 of markdown-in-descriptions.

#### Scenario: Text with newlines displays line breaks

- **WHEN** LinkedText is rendered with text "Line one\nLine two"
- **THEN** the root element has CSS class `whitespace-pre-line`

#### Scenario: Newlines preserved alongside URL detection

- **WHEN** LinkedText is rendered with text "Before\nhttps://example.com\nAfter"
- **THEN** the root element has CSS class `whitespace-pre-line`
- **THEN** the URL is still rendered as a clickable link
