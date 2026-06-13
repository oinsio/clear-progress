## Context

The app is a client-first PWA using React + Vite + TailwindCSS. It already has markdown rendering (`react-markdown` + `remark-gfm` + `@tailwindcss/typography`), i18n with auto-discovered locale files, and a sidebar with configurable menu order. Memos are static, read-only content bundled into the app — not user data, so no Dexie, no sync, no backend changes.

Driven by FR1–FR13, NFR-P1–P2, NFR-A1–A3, NFR-R1–R3 from proposal.

## Goals / Non-Goals

**Goals:**
- Bundle memo content and mermaid renderer for full offline support (G2)
- Zero-code addition of new memos — just add a `.md` file (G3)
- Consistent UI with existing pages (IdeasPage pattern)

**Non-Goals:**
- Server-side rendering of mermaid (too complex, not needed for static content)
- Extracting memos into a separate package
- Runtime content fetching or CDN loading

## Decisions

### D1: Memo files with YAML frontmatter

**Decision**: Each memo is a single `.md` file with YAML frontmatter containing metadata (`title`, `description`, `icon`, `order`).

**Alternatives considered**:
- Separate `_index.json` registry — two files per memo, risk of desync
- i18n JSON keys — markdown with mermaid doesn't fit JSON structure

**Rationale**: Standard approach (Hugo, Docusaurus, Astro). Single file = single source of truth. Frontmatter is parsed at import time via a lightweight parser (~20 lines, no `gray-matter` dependency needed).

### D2: File organization by language

**Decision**: `src/content/memos/{baseLanguage}/*.md` — one folder per base language.

```
src/content/memos/
├── index.ts           # registry: glob + parse + export
├── ru/
│   ├── task-review.md
│   ├── natural-planning.md
│   └── contexts.md
└── en/
    ├── task-review.md
    ├── natural-planning.md
    └── contexts.md
```

**Language mapping**: Use `baseLanguage` from the current locale's `_meta`. Locale `house` has `baseLanguage: "ru"` → loads from `ru/` folder. Fallback: if no folder for baseLanguage, use `DEFAULT_LANGUAGE` folder (FR13).

### D3: Auto-discovery via import.meta.glob

**Decision**: Use Vite's `import.meta.glob('./content/memos/*/*.md', { query: '?raw', import: 'default', eager: true })` to import all memo files at build time.

**Why eager**: Offline-first requirement (G2). Lazy loading would fail offline if service worker hasn't cached the chunks. Eager loading bundles all memo content into the app. For 5-10 memos (~50-100KB of markdown), the size impact is negligible.

**Registry logic**:
1. Glob returns `Record<string, string>` (path → raw content)
2. Parse each file: extract frontmatter + body
3. Derive `slug` from filename (e.g., `task-review.md` → `task-review`)
4. Derive `lang` from folder name (e.g., `./ru/task-review.md` → `ru`)
5. Group by lang, sort by `order`
6. Export `getMemos(baseLanguage): MemoEntry[]` and `getMemo(baseLanguage, slug): MemoEntry | undefined`

### D4: Mermaid bundled with theme switching

**Decision**: Install `mermaid` as a runtime dependency. Initialize once, re-render on theme change.

**Theme switching** (FR11): Listen to the app's `ColorScheme` (`system`/`light`/`dark`). Map to mermaid themes:
- Light → `"default"` theme
- Dark → `"dark"` theme

**Rendering approach**: Custom `MermaidBlock` React component that:
1. Detects ` ```mermaid ` code blocks in react-markdown via custom renderer
2. Calls `mermaid.render(id, code)` to produce SVG
3. Inserts SVG via `dangerouslySetInnerHTML` (mermaid output is trusted — it's our own bundled content)
4. Re-renders when theme changes

**Bundle impact**: ~348 KB gzipped. Acceptable for a PWA that caches everything via service worker.

### D5: Routing — two new routes

**Decision**:
- `ROUTES.MEMOS = "/memos"` — list page
- `ROUTES.MEMO = "/memos/:slug"` — detail page

Both routes inside the existing `AppLayout` wrapper. `MemosPage` and `MemoDetailPage` components.

### D6: MenuMode extension

**Decision**: Add `"memos"` to `MenuModeSchema` in `packages/contract`. Add to `FILTER_ITEMS` in Sidebar with `BookOpen` icon. Add to `DEFAULT_MENU_ORDER` before `"deleted"`, `visible: true`.

**Migration**: Existing `menuOrderStore` already handles missing modes — `migrateMenuOrder()` appends new modes automatically (see menu-order spec). No manual migration needed.

### D7: Frontmatter parser — no external dependency

**Decision**: Write a minimal frontmatter parser (~20 lines) instead of adding `gray-matter` (~100KB).

```typescript
function parseFrontmatter(raw: string): { attributes: Record<string, string>; body: string }
```

Parses YAML between `---` delimiters. Only needs to handle flat key-value pairs (title, description, icon, order). No nested YAML, no arrays.

### D8: Page structure — follow IdeasPage pattern

**Decision**: `MemosPage` follows the same layout as `IdeasPage`:
- Sidebar on configured side
- Header with page title
- Scrollable content area with cards
- No CommandBar (read-only content)
- No detail panel split — memo detail is a separate route (full page)

Mobile: list → navigate to `/memos/:slug` (full screen). Back button returns to list.
Desktop: same pattern (no split view — memos are long-form content, better full-width).

## Risks / Trade-offs

- **[Risk] Mermaid bundle size (+348KB gz)** → Acceptable for PWA with service worker caching. One-time download. Monitored via M4 metric.
- **[Risk] Mermaid XSS via dangerouslySetInnerHTML** → Mitigated: content is developer-authored, bundled at build time, not user input. No runtime content injection possible.
- **[Risk] Mermaid rendering performance on mobile** → Mitigated: diagrams are simple flowcharts (5-15 nodes), not complex graphs. NFR-P2 sets 500ms threshold.
- **[Trade-off] Eager loading all memos vs lazy** → Chose eager for offline reliability. Cost: ~50-100KB of markdown text in bundle. Benefit: guaranteed offline access.
- **[Trade-off] Separate detail route vs inline expansion** → Chose separate route for better mobile UX with long-form content. Memos are 1-3 screens of content, not suitable for inline panels.
