# Capability: Memos

## Purpose

Read-only content system for displaying markdown-based memos (guides, instructions, reference materials) with auto-discovery, language selection, and mermaid diagram rendering.

## Requirements

### Requirement: Memo registry auto-discovers markdown files

The system SHALL auto-discover all `.md` files in `src/content/memos/*/` via `import.meta.glob` with eager loading. Each file SHALL be parsed for YAML frontmatter (between `---` delimiters) and markdown body. The slug SHALL be derived from the filename without extension. The language SHALL be derived from the parent folder name.

#### Scenario: Memo file discovered and parsed
- **WHEN** file `src/content/memos/ru/inbox-processing.md` exists with valid frontmatter
- **THEN** registry contains a memo with slug `inbox-processing`, lang `ru`, and parsed title/description/icon/order

#### Scenario: New memo file added to project
- **WHEN** a new `.md` file is added to `src/content/memos/en/`
- **THEN** after rebuild, the memo appears in the registry without code changes

#### Scenario: Memo file without frontmatter is skipped
- **WHEN** a `.md` file exists without `---` frontmatter delimiters
- **THEN** the file is skipped and a console warning is logged

#### Scenario: Memo file with incomplete frontmatter is skipped
- **WHEN** a `.md` file has frontmatter missing the `title` field
- **THEN** the file is skipped and a console warning is logged

### Requirement: Memo language selection uses baseLanguage

The system SHALL select memos based on the current locale's `baseLanguage` from `_meta`. If no memos exist for the current baseLanguage, the system SHALL fall back to the `DEFAULT_LANGUAGE` folder.

#### Scenario: Russian locale loads Russian memos
- **WHEN** current locale is `ru` with baseLanguage `ru`
- **THEN** `getMemos("ru")` returns memos from `content/memos/ru/`

#### Scenario: Dialect locale uses base language memos
- **WHEN** current locale is `house` with baseLanguage `ru`
- **THEN** `getMemos("ru")` returns memos from `content/memos/ru/`

#### Scenario: Fallback to default language
- **WHEN** current baseLanguage is `fr` and no `content/memos/fr/` folder exists
- **AND** `content/memos/en/` folder exists (DEFAULT_LANGUAGE)
- **THEN** `getMemos("fr")` returns memos from `content/memos/en/`

#### Scenario: No memos at all
- **WHEN** no memo files exist for any language
- **THEN** `getMemos("ru")` returns an empty array

### Requirement: Memos list page displays cards

The memos list page at `/memos` SHALL display all available memos as cards. Each card SHALL show the memo's title, description, and icon (Lucide icon resolved by name from frontmatter). Cards SHALL be ordered by the `order` field ascending.

#### Scenario: All memos displayed as cards
- **WHEN** user navigates to `/memos`
- **AND** 4 memos exist for the current language
- **THEN** 4 memo cards are displayed with title, description, and icon

#### Scenario: Cards ordered by frontmatter order field
- **WHEN** memos have order values 3, 1, 2
- **THEN** cards are displayed in order 1, 2, 3

#### Scenario: Empty state when no memos
- **WHEN** user navigates to `/memos`
- **AND** no memos exist
- **THEN** an empty state message is displayed

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

### Requirement: Mermaid diagrams switch theme with app

Mermaid diagrams SHALL use the `"default"` mermaid theme when the app is in light mode and the `"dark"` mermaid theme when the app is in dark mode. When the user switches the app theme, all visible mermaid diagrams SHALL re-render with the new theme.

#### Scenario: Light mode uses default mermaid theme
- **WHEN** app color scheme is light
- **THEN** mermaid diagrams render with `"default"` theme

#### Scenario: Dark mode uses dark mermaid theme
- **WHEN** app color scheme is dark
- **THEN** mermaid diagrams render with `"dark"` theme

#### Scenario: Theme change triggers re-render
- **WHEN** user switches from light to dark mode
- **THEN** visible mermaid diagrams re-render with dark theme

### Requirement: Frontmatter schema validation

Each memo file SHALL contain YAML frontmatter with required fields: `title` (string), `description` (string), `icon` (string — Lucide icon name), `order` (integer). Files with missing or invalid required fields SHALL be skipped with a console warning.

#### Scenario: Valid frontmatter parsed correctly
- **WHEN** frontmatter contains `title: "Review"`, `description: "Daily review"`, `icon: "refresh-cw"`, `order: 1`
- **THEN** memo entry has matching title, description, icon, and order values

#### Scenario: Missing title field rejects file
- **WHEN** frontmatter is missing the `title` field
- **THEN** file is skipped with console warning

#### Scenario: Non-integer order field rejects file
- **WHEN** frontmatter has `order: "first"`
- **THEN** file is skipped with console warning

### Requirement: Memo detail page is keyboard accessible

Memo cards on the list page SHALL be keyboard-navigable. Enter or Space on a focused card SHALL navigate to the memo detail. The back button on the detail page SHALL be keyboard-accessible.

#### Scenario: Card activated via keyboard
- **WHEN** user focuses a memo card and presses Enter
- **THEN** user navigates to the memo detail page

#### Scenario: Back button accessible via keyboard
- **WHEN** user focuses the back button on detail page and presses Enter
- **THEN** user navigates back to the memos list

### Requirement: Memo content is responsive

The memo list SHALL display cards in a single column on mobile. Markdown content SHALL use `prose` typography for readable text. Wide mermaid diagrams SHALL scroll horizontally on narrow screens rather than being clipped.

#### Scenario: Single column on mobile
- **WHEN** viewport width is less than 1024px
- **THEN** memo cards display in a single column

#### Scenario: Wide diagram scrolls horizontally
- **WHEN** a mermaid diagram is wider than the viewport
- **THEN** the diagram container allows horizontal scrolling
