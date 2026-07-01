## Context

Mermaid diagrams fail to render offline because the mermaid library uses dynamic `import()` internally to lazy-load diagram renderers. Vite code-splits these into ~30 separate JS chunks. On first load, if the service worker hasn't finished precaching before the user goes offline, `mermaid.render()` fails when it tries to fetch the diagram renderer chunk.

Current state:
- Main bundle: 3.1 MB (`index-*.js`) — contains mermaid core but NOT diagram renderers
- Diagram chunks: ~2.4 MB across ~30 files (flowDiagram, erDiagram, ganttDiagram, etc.)
- SW precache limit: 4 MiB (`maximumFileSizeToCacheInBytes`)
- MermaidBlock returns `null` when no SVG is rendered yet, hiding the failure

## Goals / Non-Goals

**Goals:**
- Ensure all mermaid diagram renderers are available immediately after the main bundle loads (FR1)
- Show meaningful fallback when rendering fails (FR2)

**Non-Goals:**
- Selective diagram bundling (NG1 — users can upload arbitrary markdown)
- Changing SW registration strategy (NG2)

## Decisions

### D1: Use Rollup `inlineDynamicImports: true` to eliminate code splitting

**Context**: Driven by FR1 from proposal. Mermaid's internal `import()` calls create separate chunks.

**Decision**: Set `build.rollupOptions.output.inlineDynamicImports: true` in `vite.config.ts`.

**Alternatives considered**:
1. **`manualChunks` to group mermaid** — doesn't work because `manualChunks` only controls module-level splitting, not `import()` calls inside mermaid's source code
2. **Selective static import of diagram types** — mermaid's `registerLazyLoadedDiagrams()` is internal API, no public way to eagerly register built-in diagrams
3. **Rollup plugin to rewrite `import()` to static imports** — fragile, would break on mermaid updates

**Rationale**: The app has no other runtime `import()` calls in production code. All routes are statically imported. PDF worker uses `new URL()` (asset reference, unaffected by `inlineDynamicImports`). This is the simplest option with zero maintenance burden.

### D2: Increase `maximumFileSizeToCacheInBytes` to 6 MiB

**Context**: Driven by NFR-P2 from proposal. The merged bundle will be ~5.5 MB, exceeding the current 4 MiB limit.

**Decision**: Set `maximumFileSizeToCacheInBytes: 6 * 1024 * 1024` in workbox config.

**Rationale**: 6 MiB gives headroom for moderate growth. The app is a PWA that caches once and serves from cache — initial download size is acceptable.

### D3: Add `.mjs` to workbox `globPatterns`

**Context**: The PDF worker file `pdf.worker.min-*.mjs` is currently not matched by `**/*.{js,mjs,css,html,ico,png,svg}`. Wait — it IS matched, `.mjs` is already in the pattern. No change needed.

**Correction**: Current `globPatterns` already includes `mjs`. No change to glob patterns.

### D4: MermaidBlock shows source code on initial state (no SVG yet)

**Context**: Driven by FR2, UX2 from proposal. Currently, MermaidBlock returns `null` when `renderedSvg` is empty and `renderError` is empty (initial state before async render completes). If `mermaid.render()` never completes (e.g., hangs), the user sees nothing.

**Decision**: Change the "no SVG, no error" state from `return null` to render the source code in a styled code block (same styling as regular markdown code blocks). This ensures the user always sees content.

**Rationale**: The initial `null` state creates a flash of empty content on success (before SVG loads) and permanent blank space on silent failure. Showing source code first, then replacing with SVG, is a safer progressive enhancement.

## Risks / Trade-offs

- **[Bundle size increase ~2.4 MB]** → Acceptable for a PWA that caches once. Gzipped transfer size increase is ~600 KB. Monitor with NFR-P1 threshold.
- **[No code splitting at all]** → The app has a single entry point and no lazy routes, so code splitting provides no benefit currently. If lazy routing is added later, `inlineDynamicImports` must be removed and a different mermaid bundling strategy adopted.
- **[Flash of source code before diagram renders]** → The mermaid render is typically fast (<100ms). A brief flash of source code is acceptable and preferable to a blank space.
