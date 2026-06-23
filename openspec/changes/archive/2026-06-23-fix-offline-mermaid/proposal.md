# Fix Offline Mermaid

## Why

Mermaid diagrams in memos don't render when the app is used offline after a first load. The mermaid library internally uses dynamic `import()` to lazy-load diagram renderers (flowchart, gantt, etc.), and Vite code-splits them into ~30 separate chunks. If the service worker hasn't finished precaching before the user goes offline, these chunks are unavailable and `mermaid.render()` fails silently. Users can upload custom markdown files with arbitrary mermaid diagrams, so all diagram types must work offline.

## What Changes

- **MODIFIED**: Vite build config — disable code splitting for mermaid's dynamic imports via `inlineDynamicImports: true`, bundling all diagram renderers into the main chunk
- **MODIFIED**: PWA workbox config — increase `maximumFileSizeToCacheInBytes` from 4 MiB to 6 MiB to accommodate the larger main bundle (~5.5 MB)
- **MODIFIED**: MermaidBlock error handling — ensure render failures show a visible fallback instead of returning `null` or displaying raw code

## Capabilities

### Modified Capabilities

- `memos`: MermaidBlock error handling — render failures must show visible fallback with source code instead of blank space
- `pwa`: Workbox precache config — increase max file size limit and add `.mjs` to glob patterns to accommodate inlined mermaid bundle

## Goals

- G1: All mermaid diagram types render correctly when the app is offline, regardless of when the user went offline relative to service worker installation

## Non-Goals

- NG1: Reducing mermaid bundle size or tree-shaking unused diagram types — all types must be available for user-uploaded markdown
- NG2: Changing the service worker registration strategy (`prompt` → `autoUpdate`)

## Users & Scenarios

- U1: User loads the app for the first time, goes offline before service worker finishes precaching, opens a memo with a mermaid diagram — diagram must render

## Requirements

### Functional

- FR1: All mermaid diagram types (flowchart, graph, sequence, gantt, class, ER, state, journey, pie, mindmap, timeline, etc.) must render offline after the main bundle is loaded
- FR2: MermaidBlock must show a meaningful fallback when rendering fails (error state with the source code visible), never return `null` silently

### Non-Functional

#### Performance

- NFR-P1: Main JS bundle size must not exceed 6 MB (gzipped ~1.5 MB)
- NFR-P2: Service worker precache must complete successfully with the larger bundle

## UX Acceptance Criteria

- UX1: Mermaid diagrams in memos render identically online and offline
- UX2: If a diagram fails to render for any reason, the user sees the source code in a styled code block (not a blank space)

## Behavior

No new Gherkin features — this is a build configuration fix with a minor component fix.

## Visual Reference

No visual changes to diagram rendering. Error fallback uses existing prose styling.

## Affected IA

No changes.

## Success Metrics

- M1: All mermaid diagram types render offline in manual smoke test (first load → offline → open memo)
- M2: Main bundle size stays under 6 MB
- M3: Lighthouse PWA audit passes with the updated configuration

## Open Questions

None — resolved during exploration.
