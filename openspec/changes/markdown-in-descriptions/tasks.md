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

## 5. Linkify Spec Update

- [x] 5.1 Verify `LinkedText` is no longer imported in `EditableDescription` and `GoalCardViewMode` (FR8)

## 6. Build & Verify

- [x] 6.1 Run `pnpm run build` — verify no build errors
- [x] 6.2 Run full test suite for changed files — verify no regressions
