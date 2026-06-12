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
