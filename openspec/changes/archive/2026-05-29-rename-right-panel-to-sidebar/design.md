# Design: rename-right-panel-to-sidebar

## Context

`RightFilterPanel` (488 lines) was built when the panel was always on the right. A later change added `PanelSide` support, but naming was never updated. The component also exceeds the 200-line file limit because it renders two large blocks (expanded and collapsed) with duplicated filter item loops and sync/auth button logic.

Driven by FR1-FR8 from proposal.

## Goals / Non-Goals

**Goals:**
- Rename all "Right"/"right" references to "Sidebar"/"sidebar" across the monorepo
- Split `Sidebar.tsx` into subcomponents, each under 200 lines

**Non-Goals:**
- No behavior changes, no new features
- No refactoring of `InboxPage.tsx` (1028 lines — separate change)

## Decisions

### D1: Component name `Sidebar` (not `NavigationSidebar` or `AppSidebar`)

**Decision**: Use `Sidebar` as the component name.

**Rationale**: The project already has `TaskDetailPanel` for the detail panel. `Sidebar` is unambiguous in this context — there is only one sidebar. Adding `Navigation` or `App` prefix would be unnecessarily verbose. The file lives in `components/tasks/`, which provides context.

**Alternatives considered**:
- `NavigationSidebar` — too long, no disambiguation needed
- `AppSidebar` — implies app-level ownership, but it's page-level

### D2: Split strategy — extract `SidebarSyncBlock` and `SidebarFilterNav`

**Decision**: Extract two subcomponents from `Sidebar.tsx`:

```
components/tasks/
├── Sidebar.tsx               — orchestration, layout, open/close logic (~180 lines)
├── SidebarSyncBlock.tsx      — sync/auth/login button area (~120 lines)
└── SidebarFilterNav.tsx      — filter items navigation list (~150 lines)
```

**Rationale**: The current component has two clear axes of duplication:
1. **Sync/auth block** — appears in both expanded (with text labels) and collapsed (icon-only) views
2. **Filter nav items** — appears in both expanded and collapsed views with different layout

Extracting these two removes duplication and keeps each file well under 200 lines. `Sidebar.tsx` becomes a thin orchestrator that selects expanded vs collapsed and passes the right layout props.

**Alternatives considered**:
- `SidebarExpanded` + `SidebarCollapsed` — splits by mode rather than concern, would still have duplicated sync/filter logic inside each
- Extracting all three (sync, filters, search) — search block is small (~15 lines), not worth a separate file

### D3: data-testid naming scheme

**Decision**: `right-panel-*` → `sidebar-*`, `right-filter-*` → `sidebar-filter-*`.

**Rationale**: Preserves the existing structure (general sidebar elements vs filter-specific elements) while dropping the "right" prefix.

### D4: Rename all at once (single PR, not incremental)

**Decision**: Rename everything in one commit — component, types, hooks, testids, test files, integration helpers.

**Rationale**: Incremental renames leave the codebase in an inconsistent state where both naming conventions coexist. Since this is a pure rename with no behavior changes, a single atomic rename is safer and easier to review.

## Risks / Trade-offs

- [Risk] Integration tests use `data-testid` selectors → **Mitigation**: FR7 explicitly covers updating `packages/integration/src/test-helpers.ts`
- [Risk] Archive references still say "RightFilterPanel" → **Mitigation**: Archives are immutable per process invariants. Old naming in archives is expected and acceptable.
- [Risk] Large diff touches many files → **Mitigation**: All changes are mechanical renames, easy to review. No logic changes.
