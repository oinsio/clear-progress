# Tasks: Markdown in Descriptions

## 1. Setup

- [x] 1.1 Install `rehype-sanitize` dependency in `packages/client` (FR2)

## 2. DescriptionMarkdown Component (TDD)

- [x] 2.1 Create `DescriptionMarkdown` component with `react-markdown` + `remark-gfm` + `rehype-sanitize` — render markdown elements: headings, bold, italic, lists, code, strikethrough, tables (FR1, FR7)
- [x] 2.2 Add custom link renderer: `target="_blank"`, `rel="noopener noreferrer"`, `onClick stopPropagation` (FR4, FR5)
- [x] 2.3 Add XSS sanitization tests — script tags, event handlers (FR2)
- [x] 2.4 Add autolink tests — bare http/https URLs become clickable links (FR3)
- [x] 2.5 Add empty text and className support (FR1)
- [x] 2.6 Add `prose prose-sm` styling, backward compatibility for plain text (FR7, UX3)
- [x] 2.7 Mutation testing on `DescriptionMarkdown` — target >=95% (NFR-P1)

## 3. Integration into EditableDescription

- [x] 3.1 Replace `LinkedText` with `DescriptionMarkdown` in `EditableDescription` view mode (FR1, FR6)
- [x] 3.2 Update `EditableDescription` tests for markdown rendering (FR1)

## 4. Integration into GoalCardViewMode

- [x] 4.1 Replace `LinkedText` with `DescriptionMarkdown` in `GoalCardViewMode` description (FR1)
- [x] 4.2 Update `GoalCardViewMode` tests for markdown rendering (FR1)

## 4b. Integration into IdeaItem

- [x] 4b.1 Replace plain text description with `DescriptionMarkdown` in `IdeaItem` (FR1)
- [x] 4b.2 Update `IdeaItem` tests for markdown rendering (FR1)

## 5. LinkChip Component (TDD)

- [x] 5.1 Create `LinkChip` component — link emoji, text, blue background, truncation, stopPropagation, target="_blank" (FR9, FR4, FR5)
- [x] 5.2 Unit tests for `LinkChip` — renders emoji, text, href, attributes, stopPropagation (FR9)
- [x] 5.3 Mutation testing on `LinkChip` — 100% score (M2)

## 6. Linkify-style Links in DescriptionMarkdown

- [x] 6.1 Update `MarkdownLink` to use `LinkChip` — autolinks display `shortenUrl(href)`, markdown links display children (FR9)
- [x] 6.2 Update `DescriptionMarkdown` tests for linkify-style link rendering (FR9, UX4)
- [x] 6.3 Mutation testing on updated `DescriptionMarkdown` — 84.62% (2 defense-in-depth survivors: href default param, rehype-sanitize) (M2)

## 7. Remove LinkedText

- [x] 7.1 Delete `LinkedText.tsx` and `LinkedText.test.tsx` (FR10)
- [x] 7.2 Delete BDD steps `linkify_linked_text.steps.ts` and corresponding feature file (FR10)
- [x] 7.3 Remove `LinkedText` mocks from `GoalCardViewMode` test files (FR10)
- [x] 7.4 Update linkify spec — remove `LinkedText` requirements, add `LinkChip` (FR8)

## 8. Build & Verify

- [x] 8.1 Run `pnpm run build` — verify no build errors
- [x] 8.2 Run full test suite for changed files — verify no regressions
- [x] 8.3 Re-run build and tests after LinkChip/LinkedText changes

## 9. Fix textarea auto-resize (TDD)

- [x] 9.1 Write tests for `useAutoResizeTextarea` — verify resize on mount, on value change, reset to auto, null ref safety (FR11)
- [x] 9.2 Fix `useAutoResizeTextarea` — add `value` to `useEffect` dependency array (FR11)
- [x] 9.3 Verify no regressions in `EditableDescription` tests (FR6, FR11)
- [x] 9.4 Run `pnpm run build` — verify no build errors
- [x] 9.5 Mutation testing on `useAutoResizeTextarea` — target >=95% (M2)

## 10. Scroll in description textarea (FR12)

- [x] 10.1 Replace `overflow-hidden` with `overflow-y-auto` and add `max-h-[50vh]` on description textarea in `EditableDescription` (FR12)
- [x] 10.2 Fix initial auto-resize when switching to edit mode — add resize in `isEditing` focus effect (FR11, FR12)
- [x] 10.3 Verify via Playwright: textarea scrolls when content exceeds max-height, other panel elements remain accessible
- [x] 10.4 Existing `EditableDescription` and `useAutoResizeTextarea` tests pass (12 + 5 tests)
- [x] 10.5 `pnpm run build` succeeds

## 11. Plain text line breaks & view mode scroll

- [x] 11.1 Install `remark-breaks` in `packages/client` (FR13)
- [x] 11.2 Add `remark-breaks` to `DescriptionMarkdown` remarkPlugins — single `\n` renders as `<br>` (FR13, FR7)
- [x] 11.3 Add `max-h-[50vh] overflow-y-auto` to view mode container in `EditableDescription` (FR14)
- [x] 11.4 Verify via Playwright: line breaks display correctly, long descriptions scroll in view mode
- [x] 11.5 `pnpm run build` succeeds
