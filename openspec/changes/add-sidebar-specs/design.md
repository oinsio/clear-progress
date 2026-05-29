# Design: add-sidebar-specs

## Context

The sidebar has ~9 distinct behaviors (toggle, side, always-open, modes, menu order, sync status, focused goals, search, responsive) but no formal spec and only partial unit test coverage (connection status only). This change adds a comprehensive spec and BDD unit tests.

Depends on `rename-right-panel-to-sidebar` being completed first.

## Goals / Non-Goals

**Goals:**
- Comprehensive spec for all sidebar behaviors
- BDD unit tests that serve as executable documentation

**Non-Goals:**
- No E2E tests (sidebar is tested via unit BDD with vitest-cucumber, not playwright-bdd)
- No refactoring of the component itself

## Decisions

### D1: New capability `sidebar-navigation` rather than extending `app-shell-navigation`

**Decision**: Create a dedicated `sidebar-navigation` capability spec. Move the sidebar login button requirement out of `app-shell-navigation`.

**Rationale**: `app-shell-navigation` covers BottomNav, AppShell, PageShell, and routing — all app-level frame concerns. The sidebar is a complex navigation component with its own state management (5 hooks, localStorage persistence, multiple modes). Mixing it into app-shell would make that spec too large and unfocused.

**Alternatives considered**:
- Extend `app-shell-navigation` — would bloat it from 10 to 20+ requirements, violating "one file = one thing"

### D2: BDD unit tests (vitest-cucumber), not E2E

**Decision**: Use vitest-cucumber for BDD tests, not playwright-bdd.

**Rationale**: Sidebar behaviors are testable at the component level with React Testing Library. Toggle, mode switching, side placement, and sync status are all driven by props and hooks — no real browser needed. E2E tests would be slower and add no additional confidence for these behaviors.

**Alternatives considered**:
- playwright-bdd E2E — overkill for component-level behavior, save for NFR scenarios (a11y, responsive)

### D3: Feature file organization — one file per behavior group

**Decision**: Four feature files split by behavior concern:
- `sidebar_toggle.feature` — open/close, always-open, collapsed strip
- `sidebar_mode.feature` — mode selection, route navigation, toggle off
- `sidebar_side.feature` — left/right layout, element ordering
- `sidebar_sync.feature` — sync statuses, auth states, login button

**Rationale**: Follows existing project convention (see `task_detail_panel_*.feature` — split by concern). Each file stays focused and under 400 lines.

### D4: Spec structure — group requirements by behavior domain

**Decision**: Group spec requirements into sections:
1. Panel state (toggle, always-open)
2. Mode selection
3. Side placement
4. Menu order and filter items
5. Sync and auth status
6. Focused goals block
7. Search button
8. Accessibility

This mirrors the actual code structure and makes requirements easy to find.

## Risks / Trade-offs

- [Risk] Existing `RightFilterPanel.test.tsx` (now `Sidebar.test.tsx`) overlaps with new BDD tests for sync status → **Mitigation**: Keep existing unit tests as-is, BDD tests add structured coverage. Can consolidate later.
- [Risk] BDD step definitions may need complex React Testing Library setup with multiple providers → **Mitigation**: Follow existing patterns in `goal_focus_navigation.steps.ts` which already mocks similar providers.
