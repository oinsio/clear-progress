# Markdown in Descriptions

## Why

Task, goal, and idea descriptions are displayed as plain text without formatting. Users cannot highlight structure (headings, lists, bold/italic, code blocks), which reduces readability of longer descriptions. The `react-markdown` and `remark-gfm` libraries are already installed in the project (used for .md file attachment previews) but are not applied to description fields.

## What Changes

- **ADDED**: Markdown rendering in view mode for `description` fields of Task, Goal, Idea
- **ADDED**: XSS protection via `rehype-sanitize` when rendering markdown
- **ADDED**: `LinkChip` — shared component for linkify-style link display (emoji + shortened/custom text)
- **ADDED**: Links in markdown render in linkify style: autolinks show `shortenUrl`, markdown links show custom text, both with link emoji
- **MODIFIED**: `EditableDescription` — view mode switches from `LinkedText` to markdown renderer
- **MODIFIED**: `GoalCardViewMode` — goal description renders via markdown instead of `LinkedText`
- **MODIFIED**: `IdeaItem` — idea description renders via markdown instead of plain text
- **REMOVED**: `LinkedText` component and its tests — no longer used after migration to `DescriptionMarkdown`
- **MODIFIED**: Linkify spec — `LinkedText` removed, `LinkChip` added as shared link display component

## Capabilities

### New Capabilities

- `description-markdown`: Markdown rendering for description fields of entities (Task, Goal, Idea) in view mode. Includes XSS sanitization, autolink for bare URLs, linkify-style link display, styling via Tailwind Typography.
- `link-chip`: Shared link display component — renders links with emoji icon, shortened URL (for autolinks) or custom text (for markdown links), stopPropagation, target="_blank".

### Modified Capabilities

- `linkify`: `LinkedText` component removed — no longer used in production code. Link display logic extracted into `LinkChip`. Utility functions `extractLinks` and `shortenUrl` remain available.

### Removed Capabilities

- `linked-text`: `LinkedText` component and its unit/BDD tests removed. Replaced by `DescriptionMarkdown` + `LinkChip` for descriptions.

## Goals

- **G1**: User sees formatted descriptions (headings, lists, bold, italic, code, tables, links) in view mode of tasks, goals, and ideas
- **G2**: Existing plain text descriptions display correctly without artifacts (plain text is valid markdown)

## Non-Goals

- **NG1**: WYSIWYG or toolbar for markdown editing — user writes raw markdown in textarea
- **NG2**: Markdown in entity names — only in description fields
- **NG3**: Markdown in checklists — only in description fields
- **NG4**: Server-side markdown processing — rendering is client-side only

## Users & Scenarios

- **U1**: User adds markdown syntax to a task description and sees formatted output when exiting edit mode
- **U2**: User sees existing plain text descriptions without any display changes
- **U3**: User pastes a bare URL into a description — it automatically becomes a clickable link (autolink)

## Requirements

### Functional

- **FR1**: View mode of Task, Goal, Idea descriptions renders markdown via `react-markdown` + `remark-gfm`
- **FR2**: HTML in markdown is sanitized via `rehype-sanitize` to prevent XSS
- **FR3**: Bare URLs (http/https) in descriptions automatically become clickable links (remark-gfm autolink)
- **FR4**: Clicking a link inside markdown calls `stopPropagation`, preventing parent handlers from firing
- **FR5**: Links in markdown open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`)
- **FR6**: Edit mode remains a textarea with raw markdown text
- **FR7**: Plain text descriptions (without markdown syntax) display correctly — no visual artifacts
- **FR8**: Linkify spec is updated — `LinkedText` removed, `LinkChip` documented
- **FR9**: All links in markdown (autolinks and markdown links) render in linkify style — link emoji + display text, background highlight, truncation
- **FR10**: `LinkedText` component and its tests are removed from codebase

### Non-Functional

#### Performance

- **NFR-P1**: Markdown description rendering adds no visible delay when switching from edit to view mode

#### Accessibility

- **NFR-A1**: Markdown rendering preserves semantic HTML structure (h1-h6, ul/ol, a, strong, em, code)
- **NFR-A2**: Links in markdown are keyboard-accessible and have focus styles

#### Responsive

- **NFR-R1**: Markdown content wraps correctly on mobile screens; tables have horizontal scroll when needed

## UX Acceptance Criteria

- **UX1**: Clicking on a description opens a textarea with raw markdown
- **UX2**: On textarea blur, the description renders as formatted markdown
- **UX3**: Markdown styling uses `prose prose-sm` (Tailwind Typography) — compact appearance suitable for cards
- **UX4**: Links display in linkify style — link emoji, blue text on light blue background, shortened URL for autolinks, custom text for markdown links
- **UX5**: Empty description shows a placeholder (current behavior preserved)

## UI States Matrix

| State               | Data                          | UI                                        |
|---------------------|-------------------------------|-------------------------------------------|
| Empty description   | `""`                          | Placeholder text, clickable area          |
| Plain text (legacy) | `"Simple text"`               | Text as paragraph, no artifacts           |
| Markdown formatted  | `"# Title\n- item"`           | Rendered markdown with heading and list   |
| With URLs           | `"See https://example.com"`   | Linkify-style link: emoji + `example.com` |
| With markdown links | `"[text](url)"`               | Linkify-style link: emoji + "text"        |
| With XSS attempt    | `"<script>alert(1)</script>"` | Sanitized text, script does not execute   |
| Editing             | any                           | Textarea with raw markdown text           |

## Behavior

Gherkin scenarios will be in `features/description-markdown.feature` with `@markdown-in-descriptions` tags.

## Visual Reference

Styling via Tailwind Typography (`prose prose-sm`). Design tokens are the source of truth for colors and typography.

## Affected IA

No changes — descriptions already exist in the current IA. Only rendering is added.

## Success Metrics

- **M1**: 100% of description fields (Task, Goal, Idea) render markdown in view mode
- **M2**: Mutation testing score >= 95% on new code
- **M3**: No XSS vulnerabilities — rehype-sanitize blocks all dangerous constructs

## Open Questions

None.
