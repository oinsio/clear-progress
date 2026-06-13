## 1. Contract & Constants

- [ ] 1.1 Add `"memos"` to `MenuModeSchema` in `packages/contract/src/schemas/local-storage.ts` (FR12)
- [ ] 1.2 Add `ROUTES.MEMOS = "/memos"` and `ROUTES.MEMO = "/memos/:slug"` to `packages/client/src/constants/index.ts` (FR2, FR5)
- [ ] 1.3 Add `"memos"` to `DEFAULT_MENU_ORDER` before `"deleted"` with `visible: true` in `packages/client/src/constants/index.ts` (FR12)
- [ ] 1.4 Add i18n keys for memos (`filter.memos`, `memo.pageName`, `memo.empty`, `memo.notFound`, `memo.back`) to `en.json` and `ru.json` (FR1, FR3)
- [ ] 1.5 Verify build: `pnpm run build` passes

## 2. Memo Registry (TDD)

- [ ] 2.1 Write tests for `parseFrontmatter` function: valid YAML, missing delimiters, incomplete fields, non-integer order (FR10)
- [ ] 2.2 Implement `parseFrontmatter` in `src/content/memos/parseFrontmatter.ts` (D7)
- [ ] 2.3 Write tests for `memoRegistry`: getMemos returns sorted entries, language fallback, empty state, invalid files skipped (FR4, FR8, FR9, FR13)
- [ ] 2.4 Implement `memoRegistry` in `src/content/memos/index.ts` with `import.meta.glob` eager loading (D3, FR8)
- [ ] 2.5 Run mutation testing on `parseFrontmatter.ts` and memo registry — target >=95%

## 3. Mermaid Integration

- [ ] 3.1 Install `mermaid` dependency: `pnpm add mermaid --filter @clear-progress/client` (D4)
- [ ] 3.2 Create `MermaidBlock` component in `src/components/memos/MermaidBlock.tsx`: renders mermaid code to SVG, listens to theme changes, adds `role="img"` (FR6, FR11, NFR-A2)
- [ ] 3.3 Create `MemoMarkdown` component in `src/components/memos/MemoMarkdown.tsx`: react-markdown with custom code renderer that delegates mermaid blocks to `MermaidBlock` (FR6)
- [ ] 3.4 Verify mermaid renders in both light and dark themes (FR11)

## 4. Sidebar & Navigation

- [ ] 4.1 Add `BookOpen` import and `"memos"` filter item to `FILTER_ITEMS` in `Sidebar.tsx` before `"deleted"` (FR1, FR2)
- [ ] 4.2 Add `"memos"` to `SidebarMode` type union in `Sidebar.tsx`
- [ ] 4.3 Add routes for `MemosPage` and `MemoDetailPage` in `router.tsx` (FR2, FR5)
- [ ] 4.4 Verify sidebar shows "Memos" with BookOpen icon, click navigates to `/memos`

## 5. Pages

- [ ] 5.1 Create `MemoCard` component in `src/components/memos/MemoCard.tsx`: displays title, description, icon; keyboard accessible with Enter/Space (FR3, NFR-A1)
- [ ] 5.2 Create `MemosPage` in `src/pages/MemosPage.tsx`: fetches memos for current baseLanguage, renders cards sorted by order, empty state (FR3, FR4, UX1)
- [ ] 5.3 Create `MemoDetailPage` in `src/pages/MemoDetailPage.tsx`: reads slug from URL, renders MemoMarkdown, back button, "not found" state (FR5, FR6, FR7, NFR-A3)
- [ ] 5.4 Verify responsive layout: single column mobile, comfortable reading, horizontal scroll for wide diagrams (NFR-R1, NFR-R2, NFR-R3, UX2, UX3)

## 6. Memo Content

- [ ] 6.1 Create `src/content/memos/ru/task-review.md` with frontmatter and mermaid diagrams (order: 1)
- [ ] 6.2 Create `src/content/memos/ru/natural-planning.md` with frontmatter and mermaid diagrams (order: 2)
- [ ] 6.3 Create `src/content/memos/ru/contexts.md` with frontmatter and mermaid diagrams (order: 3)
- [ ] 6.4 Create English versions: `src/content/memos/en/task-review.md`, `natural-planning.md`, `contexts.md`

## 7. Verification

- [ ] 7.1 BDD unit tests (vitest-cucumber): memo registry scenarios from memos spec (@add-memos @FR8 @FR9 @FR10 @FR13)
- [ ] 7.2 BDD unit tests: frontmatter validation scenarios (@add-memos @FR10)
- [ ] 7.3 Run mutation testing on all new files — target >=95%
- [ ] 7.4 Verify build: `pnpm run build` — check mermaid bundle size increase < 400 KB gzipped (M4)
- [ ] 7.5 Manual verification: all 3 memos render in ru and en, mermaid diagrams in light/dark, offline access after cache (M1, M2, M5)
- [ ] 7.6 Verify adding a new `.md` file (without code changes) results in it appearing after rebuild (M3)
