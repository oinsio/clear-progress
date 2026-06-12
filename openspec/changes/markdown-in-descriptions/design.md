# Design: Markdown in Descriptions

## Context

Task, Goal, and Idea descriptions in view mode are rendered via `LinkedText` — a component that detects URLs using `extractLinks()` and displays them as clickable links. The remaining text is shown as plain text with `whitespace-pre-line`.

The project already has `react-markdown` (^10.1.0) and `remark-gfm` (^4.0.1) installed — used in `MarkdownPreview` for .md file attachment previews. These dependencies should be reused for rendering markdown in descriptions.

Entry points:
- `EditableDescription` — used in `TaskDetailsTab`, `GoalEditDetailsTab`, `IdeaDetailPanel`
- `GoalCardViewMode` — directly uses `LinkedText` for goal description
- `IdeaItem` — directly renders idea description as plain text

## Goals / Non-Goals

**Goals:**
- Replace `LinkedText` with a markdown renderer in description view mode (FR1)
- Ensure XSS protection via `rehype-sanitize` (FR2)
- Preserve link behavior: stopPropagation, target="_blank" (FR4, FR5)
- Update linkify spec (FR8)

**Non-Goals:**
- Change edit mode — textarea with raw markdown (FR6)
- Server-side markdown processing

## Decisions

### D1: New `DescriptionMarkdown` component instead of modifying `LinkedText`

**Decision**: Create a new `DescriptionMarkdown` component in `components/ui/`.

**Rationale**: `LinkedText` has its own specifics (extractLinks, shortenUrl, link emoji icon) and is used/may be used for short text (names). Markdown rendering is a different responsibility with a different set of dependencies.

**Alternative**: Modify `LinkedText` with a `markdown?: boolean` prop — rejected because it violates SRP and overcomplicates the component.

### D2: rehype-sanitize for XSS protection

**Decision**: Install `rehype-sanitize` and use the default sanitization schema.

**Rationale**: `react-markdown` does not render raw HTML by default (`<script>`, `<img onerror>`), but with `remark-gfm` and `rehype-raw` (if added later) this could change. `rehype-sanitize` is an explicit architectural safeguard (FR2).

**Alternative**: Rely on react-markdown's default behavior — rejected because it creates an implicit dependency on the library's internal implementation.

### D3: Custom renderer for `<a>` tags via `LinkChip`

**Decision**: Pass `components={{ a: MarkdownLink }}` to react-markdown, where `MarkdownLink` renders links via the shared `LinkChip` component. For autolinks (`children === href`), display `shortenUrl(href)`. For markdown links (`[text](url)`), display the custom text as-is.

**Rationale**: react-markdown allows overriding HTML element rendering. Extracting link display into `LinkChip` ensures consistent linkify-style appearance across the app (FR4, FR5, FR9).

### D4: Styling via Tailwind Typography (prose prose-sm)

**Decision**: Wrap markdown content in `<div className="prose prose-sm">`.

**Rationale**: Tailwind Typography is already used in `MarkdownPreview`. prose-sm provides compact typography suitable for cards (UX3).

### D5: autolink via remark-gfm replaces extractLinks for descriptions

**Decision**: `remark-gfm` includes autolink — bare URLs automatically become clickable. This replaces the `extractLinks` functionality for descriptions.

**Rationale**: Duplicating URL detection logic (extractLinks + remark-gfm autolink) creates conflicts. remark-gfm autolink is the standard solution in the markdown ecosystem (FR3).

### D6: `LinkChip` — shared component for linkify-style links

**Decision**: Extract link display (emoji + text + styling + stopPropagation + target="_blank") into a `LinkChip` component in `components/ui/`. Used by `DescriptionMarkdown` for all links in markdown.

**Rationale**: Link display style (blue background, emoji, truncation, stopPropagation) was previously embedded in `LinkedText`. Since `LinkedText` is being removed, the visual style needs a new home. `LinkChip` is a focused, single-responsibility component (FR9).

**Alternative**: Inline the styles directly in `MarkdownLink` — rejected because it creates duplication if link chips are needed elsewhere in the future.

### D7: Remove `LinkedText` component

**Decision**: Delete `LinkedText.tsx`, `LinkedText.test.tsx`, and BDD steps `linkify_linked_text.steps.ts`. Update the linkify spec to remove `LinkedText` requirements.

**Rationale**: After migrating descriptions to `DescriptionMarkdown`, `LinkedText` has zero production imports. Keeping dead code increases maintenance burden and confuses future contributors (FR10).

**Alternative**: Keep `LinkedText` for potential future use — rejected because YAGNI; `LinkChip` + `DescriptionMarkdown` cover all current needs.

## Risks / Trade-offs

- **[Risk] Prose styles may conflict with current card styles** -> Mitigation: prose-sm is minimal; can be customized via prose overrides if needed
- **[Risk] Existing descriptions with `#`, `*`, `-` at the beginning of lines will be interpreted as markdown** -> Mitigation: Unlikely in regular text; if a user typed `# Heading`, they most likely intended a heading (G2, FR7)
- **[Risk] rehype-sanitize may block needed HTML elements** -> Mitigation: Default schema allows all standard elements; can be extended if needed
