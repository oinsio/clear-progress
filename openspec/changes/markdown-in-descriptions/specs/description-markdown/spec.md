# Description Markdown

Markdown rendering for description fields of Task, Goal, and Idea entities in view mode. Uses `react-markdown` with `remark-gfm` for GitHub Flavored Markdown and `rehype-sanitize` for XSS protection.

## ADDED Requirements

### Requirement: Markdown rendering in view mode

The `DescriptionMarkdown` component SHALL render markdown text as formatted HTML using `react-markdown` with `remark-gfm` plugin. Implements FR1 of markdown-in-descriptions.

#### Scenario: Heading renders as HTML heading

- **WHEN** DescriptionMarkdown is rendered with text "# My Heading"
- **THEN** an h1 element with text "My Heading" is present

#### Scenario: Bold text renders as strong

- **WHEN** DescriptionMarkdown is rendered with text "This is **bold** text"
- **THEN** a strong element with text "bold" is present

#### Scenario: Italic text renders as emphasis

- **WHEN** DescriptionMarkdown is rendered with text "This is *italic* text"
- **THEN** an em element with text "italic" is present

#### Scenario: Unordered list renders as ul

- **WHEN** DescriptionMarkdown is rendered with text "- item one\n- item two"
- **THEN** an ul element with two li elements is present

#### Scenario: Code block renders as code

- **WHEN** DescriptionMarkdown is rendered with text containing a fenced code block
- **THEN** a code element with the code content is present

#### Scenario: Strikethrough renders as del

- **WHEN** DescriptionMarkdown is rendered with text "This is ~~deleted~~ text"
- **THEN** a del element with text "deleted" is present

#### Scenario: Table renders as HTML table

- **WHEN** DescriptionMarkdown is rendered with a GFM table
- **THEN** a table element with thead and tbody is present

### Requirement: XSS sanitization

The `DescriptionMarkdown` component SHALL sanitize HTML in markdown input via `rehype-sanitize` to prevent XSS attacks. Implements FR2 of markdown-in-descriptions.

#### Scenario: Script tag is sanitized

- **WHEN** DescriptionMarkdown is rendered with text containing `<script>alert('xss')</script>`
- **THEN** no script element is present in the DOM
- **THEN** the text "alert('xss')" is not executed

#### Scenario: Event handler attribute is sanitized

- **WHEN** DescriptionMarkdown is rendered with text containing `<img src=x onerror="alert('xss')">`
- **THEN** no onerror attribute is present in the rendered output

### Requirement: Autolink for bare URLs

The `DescriptionMarkdown` component SHALL automatically convert bare http/https URLs into clickable links via `remark-gfm` autolink. Implements FR3 of markdown-in-descriptions.

#### Scenario: Bare HTTPS URL becomes a link

- **WHEN** DescriptionMarkdown is rendered with text "Visit https://example.com for info"
- **THEN** an anchor element with href "https://example.com" is present

#### Scenario: Bare HTTP URL becomes a link

- **WHEN** DescriptionMarkdown is rendered with text "See http://example.com"
- **THEN** an anchor element with href "http://example.com" is present

### Requirement: Linkify-style link display

All links rendered by `DescriptionMarkdown` SHALL display in linkify style via `LinkChip` — with link emoji, styled background, and appropriate display text. Implements FR9 of markdown-in-descriptions.

#### Scenario: Autolink displays shortened URL with emoji

- **WHEN** DescriptionMarkdown is rendered with text "Visit https://example.com/path for info"
- **THEN** the link displays with link emoji and shortened URL "example.com/path"

#### Scenario: Markdown link displays custom text with emoji

- **WHEN** DescriptionMarkdown is rendered with text "[My Link](https://example.com)"
- **THEN** the link displays with link emoji and text "My Link"

#### Scenario: Link has linkify background styling

- **WHEN** DescriptionMarkdown is rendered with text containing a link
- **THEN** the link has blue background highlight styling

### Requirement: Link click propagation prevention

All links rendered by `DescriptionMarkdown` SHALL stop click event propagation via `LinkChip`, preventing parent handlers from firing. Implements FR4 of markdown-in-descriptions.

#### Scenario: Link click does not propagate to parent

- **WHEN** a link inside DescriptionMarkdown is clicked
- **THEN** the parent onClick handler is not called

### Requirement: Links open in new tab

All links rendered by `DescriptionMarkdown` SHALL open in a new tab with security attributes via `LinkChip`. Implements FR5 of markdown-in-descriptions.

#### Scenario: Link has correct target and rel attributes

- **WHEN** DescriptionMarkdown is rendered with text containing a markdown link `[Example](https://example.com)`
- **THEN** the anchor element has target="_blank" and rel="noopener noreferrer"

### Requirement: Plain text backward compatibility

The `DescriptionMarkdown` component SHALL render plain text (without markdown syntax) as a simple paragraph without visual artifacts. Implements FR7 of markdown-in-descriptions.

#### Scenario: Plain text renders as paragraph

- **WHEN** DescriptionMarkdown is rendered with text "Just plain text without any formatting"
- **THEN** the text is visible as a paragraph
- **THEN** no unexpected visual artifacts are present

#### Scenario: Multiline plain text preserves line breaks

- **WHEN** DescriptionMarkdown is rendered with text "Line one\nLine two"
- **THEN** both lines are visible as separate lines or paragraphs

### Requirement: Empty text rendering

The `DescriptionMarkdown` component SHALL render an empty element when given empty text input. Implements FR1 of markdown-in-descriptions.

#### Scenario: Empty text renders empty element

- **WHEN** DescriptionMarkdown is rendered with empty text
- **THEN** the rendered element is an empty DOM element

### Requirement: Custom className support

The `DescriptionMarkdown` component SHALL apply a custom className to the root element when provided. Implements FR1 of markdown-in-descriptions.

#### Scenario: Custom className is applied

- **WHEN** DescriptionMarkdown is rendered with className "custom-class"
- **THEN** the root element has the class "custom-class"

### Requirement: Prose styling

The `DescriptionMarkdown` component SHALL apply Tailwind Typography `prose prose-sm` classes for compact markdown styling. Implements UX3 of markdown-in-descriptions.

#### Scenario: Prose classes are applied

- **WHEN** DescriptionMarkdown is rendered with any markdown text
- **THEN** the root element has classes "prose" and "prose-sm"

### Requirement: EditableDescription uses markdown in view mode

The `EditableDescription` component SHALL use `DescriptionMarkdown` instead of `LinkedText` for rendering description text in view mode. Implements FR1 of markdown-in-descriptions.

#### Scenario: View mode shows formatted markdown

- **WHEN** EditableDescription is in view mode with markdown text "**bold** text"
- **THEN** the text is rendered with bold formatting via DescriptionMarkdown

#### Scenario: Edit mode shows raw markdown

- **WHEN** EditableDescription is clicked to enter edit mode
- **THEN** a textarea with raw markdown text is displayed

### Requirement: GoalCardViewMode uses markdown for description

The `GoalCardViewMode` component SHALL use `DescriptionMarkdown` instead of `LinkedText` for rendering goal description. Implements FR1 of markdown-in-descriptions.

#### Scenario: Goal card shows formatted description

- **WHEN** GoalCardViewMode is rendered with a goal that has markdown in description
- **THEN** the description is rendered with markdown formatting

### Requirement: LinkChip shared component

The `LinkChip` component SHALL render a styled link with emoji icon, display text, stopPropagation, and target="_blank". Implements FR9, FR4, FR5 of markdown-in-descriptions.

#### Scenario: LinkChip renders emoji and text

- **WHEN** LinkChip is rendered with href "https://example.com" and children "Example"
- **THEN** a link emoji icon is displayed
- **THEN** the text "Example" is displayed

#### Scenario: LinkChip has correct link attributes

- **WHEN** LinkChip is rendered with href "https://example.com"
- **THEN** the anchor has target="_blank" and rel="noopener noreferrer"

#### Scenario: LinkChip stops click propagation

- **WHEN** a LinkChip is clicked inside a clickable parent
- **THEN** the parent onClick handler is not called

#### Scenario: LinkChip applies styling

- **WHEN** LinkChip is rendered
- **THEN** the link has blue background highlight and rounded styling

#### Scenario: LinkChip truncates long text

- **WHEN** LinkChip is rendered with long display text
- **THEN** the text is truncated with max-width constraint
