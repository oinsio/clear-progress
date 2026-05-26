## Context

App shell navigation is already implemented with three components (AppShell, PageShell, BottomNav) and a routing configuration (router.tsx). This change adds specs and BDD tests only — no implementation changes.

The implementation uses:
1. **AppShell** — outer flex container wrapping all page content
2. **PageShell** — inner wrapper adding BottomNav (mobile-only via `md:hidden`)
3. **BottomNav** — `<nav>` with five NavLink items from BOTTOM_NAV_ITEMS array
4. **router.tsx** — createBrowserRouter with AppLayout (AppShell+Outlet) and PageLayout (PageShell+Outlet) nesting

## Goals / Non-Goals

**Goals:**
- Specify existing navigation behavior (FR1-FR10)
- Cover with BDD unit tests

**Non-Goals:**
- Modify the implementation
- Write E2E tests for responsive/a11y (separate change)

## Decisions

### D1: BDD tests at the component level (vitest-cucumber + testing-library)

**Rationale**: BottomNav and routing are React components. BDD unit tests use `@testing-library/react` with `MemoryRouter` to test rendering and active state. This matches existing patterns (BottomNav.test.tsx, PageShell.test.tsx).

**Alternative**: Test at the hook/service level. Rejected — navigation items and active state are component-level concerns, not hooks or services.

### D2: Three feature files split by aspect

**Rationale**: Following the one-feature-per-aspect convention (FR1-FR3 nav items, FR3 active state, FR4-FR7 routing). Keeps each file focused and under 400 lines.

### D3: BOTTOM_NAV_ITEMS array as the source of truth for nav item tests

**Rationale**: Tests verify the BOTTOM_NAV_ITEMS exported constant and its rendering. This avoids duplicating route/label values in tests and instead asserts on the structure.

## Risks / Trade-offs

- [Duplication] BDD scenarios overlap with existing BottomNav.test.tsx and PageShell.test.tsx — Acceptable: BDD serves as executable spec, existing tests provide detailed coverage. Different purposes.
