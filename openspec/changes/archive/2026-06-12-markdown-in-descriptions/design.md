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

### D8: Fix `useAutoResizeTextarea` to recalculate on value change

**Decision**: Add `value` to the `useEffect` dependency array in `useAutoResizeTextarea`. Rename `_value` to `value` to reflect it is actively used.

**Rationale**: The hook only recalculated textarea height on mount (`[]` dependencies). With markdown descriptions, users type multi-line content and the textarea must grow dynamically. Without this fix, long text is clipped by `overflow-hidden` (FR6, FR11).

**Alternative**: Use CSS `field-sizing: content` — rejected because browser support is insufficient (no Firefox/Safari as of 2025).

### D9: Scroll in description textarea with max-height cap

**Decision**: Replace `overflow-hidden` with `overflow-y-auto` and add `max-h-[50vh]` on description textarea. Trigger auto-resize explicitly when textarea first appears (in the `isEditing` effect), not only on `value` change.

**Rationale**: With `useAutoResizeTextarea`, the textarea grows infinitely to fit content. For long descriptions this pushes "Коробочка", "Повтор", and other controls off-screen. Capping at 50vh keeps the textarea large enough for comfortable editing while preserving access to other panel elements. The `useAutoResizeTextarea` effect depends on `[value]`, but when switching from view to edit mode `value` doesn't change — so the effect doesn't fire and `style.height` stays empty. Adding resize logic to the `isEditing` focus effect fixes the initial render (FR11, FR12).

**Alternative**: Remove auto-resize entirely and use a fixed-height textarea with scroll — rejected because short descriptions would waste space with an oversized field.

### D10: remark-breaks for plain text line breaks

**Decision**: Install `remark-breaks` and add it to `DescriptionMarkdown` alongside `remark-gfm`.

**Rationale**: Standard Markdown ignores single `\n` — two newlines are required for a paragraph break. Users entering plain text with Enter expect visible line breaks, not collapsed spaces. `remark-breaks` converts single `\n` to `<br>`, matching textarea behavior (FR13, FR7).

**Alternative**: Use CSS `white-space: pre-line` on the markdown container — rejected because it conflicts with `prose` styles and breaks proper markdown paragraph spacing.

### D11: Scroll in description view mode container

**Decision**: Add `max-h-[50vh] overflow-y-auto` to the view mode wrapper in `EditableDescription` (the `<div>` that renders `DescriptionMarkdown`).

**Rationale**: FR12 added scroll to the textarea (edit mode), but the view mode container had no height limit. Long rendered descriptions pushed "Статус", "Коробочка", and action buttons off-screen. Matching the `50vh` cap from edit mode ensures consistent behavior in both modes (FR14).

**Alternative**: Make the entire edit panel scrollable — rejected because it would scroll the title and other fields too, which should remain visible.

## Risks / Trade-offs

- **[Risk] Prose styles may conflict with current card styles** -> Mitigation: prose-sm is minimal; can be customized via prose overrides if needed
- **[Risk] Existing descriptions with `#`, `*`, `-` at the beginning of lines will be interpreted as markdown** -> Mitigation: Unlikely in regular text; if a user typed `# Heading`, they most likely intended a heading (G2, FR7)
- **[Risk] rehype-sanitize may block needed HTML elements** -> Mitigation: Default schema allows all standard elements; can be extended if needed
