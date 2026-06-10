## Context

The app is deployed to GitHub Pages at the subpath `/clear-progress/` (Vite config: `base: basePath`). The `useShare` hook builds the URL via `window.location.origin`, which returns only protocol + host (`https://oinsio.github.io`) without the base path. Driven by FR1 from proposal.

## Goals / Non-Goals

**Goals:**
- Correct URL regardless of the `base` value in Vite config

**Non-Goals:**
- Deep-linking to a specific page within the app

## Decisions

### D1: Use `import.meta.env.BASE_URL`

**Decision**: Build the URL as `window.location.origin + import.meta.env.BASE_URL`.

**Alternatives considered:**
- `window.location.href` — copies the current page URL (e.g. `/settings`), not the app root
- `window.location.pathname` — depends on the current route, unstable
- Hardcoded `/clear-progress/` — violates the no-hardcoded-values rule, breaks if base changes

**Rationale**: `import.meta.env.BASE_URL` is the standard Vite mechanism, already used in the config (`base: basePath`). The value is injected at build time and is guaranteed to match the actual base path. In dev mode it equals `"/"`, in production — `"/clear-progress/"`.

## Risks / Trade-offs

- [Double slash] → `BASE_URL` always ends with `/`, `origin` never ends with `/` — concatenation is safe, trailing slash is acceptable in URLs
