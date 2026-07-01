## MODIFIED Requirements

### Requirement: Memo detail page renders markdown with mermaid

The memo detail page at `/memos/:slug` SHALL render the full markdown content of the selected memo. Code blocks with language `mermaid` SHALL be rendered as SVG diagrams via the mermaid library. All mermaid diagram types SHALL render offline after the main bundle is loaded. The page SHALL display the memo title as a header and provide back navigation to the memos list.

When mermaid rendering has not yet completed or fails, MermaidBlock SHALL display the mermaid source code in a styled code block as a fallback. MermaidBlock SHALL never render blank space (return `null`).

#### Scenario: Memo content rendered as formatted markdown
- **WHEN** user navigates to `/memos/inbox-processing`
- **THEN** the page displays the memo title as header
- **AND** markdown content is rendered with headings, lists, and formatted text

#### Scenario: Mermaid code blocks rendered as SVG diagrams
- **WHEN** memo content contains a ` ```mermaid ` code block
- **THEN** the code block is rendered as an inline SVG diagram
- **AND** the SVG has `role="img"`

#### Scenario: Mermaid diagrams render offline
- **WHEN** the app main bundle is loaded
- **AND** the device is offline
- **AND** user navigates to a memo with a mermaid diagram
- **THEN** the mermaid diagram renders as an SVG diagram

#### Scenario: Mermaid render failure shows source code fallback
- **WHEN** mermaid rendering fails for any reason
- **THEN** the mermaid source code is displayed in a styled code block
- **AND** no blank space is shown

#### Scenario: Mermaid initial state shows source code until render completes
- **WHEN** mermaid rendering has not yet completed
- **THEN** the mermaid source code is displayed in a styled code block
- **AND** when rendering completes, the source code is replaced with the SVG diagram

#### Scenario: Back navigation returns to list
- **WHEN** user is on `/memos/inbox-processing`
- **AND** user activates the back button
- **THEN** user navigates to `/memos`

#### Scenario: Invalid slug shows empty state
- **WHEN** user navigates to `/memos/nonexistent`
- **THEN** a "memo not found" message is displayed
