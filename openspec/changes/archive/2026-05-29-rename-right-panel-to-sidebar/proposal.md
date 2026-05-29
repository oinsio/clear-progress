# rename-right-panel-to-sidebar

## Why

The navigation panel was originally on the right side only, so it was named `RightFilterPanel`. A later change added left-side placement (`PanelSide`), making the "Right" prefix misleading. The component is also 488 lines (over the 200-line limit) and mixes expanded/collapsed rendering logic. This refactoring corrects the naming, splits the oversized component, and updates all references (types, hooks, data-testid, specs).

## What Changes

- **RENAMED** `RightFilterPanel` component and file to `Sidebar`
- **RENAMED** `RightPanelMode` type to `SidebarMode`
- **RENAMED** `RightFilterPanelProps` to `SidebarProps`
- **RENAMED** `useRightPanelNavigation` hook to `useSidebarNavigation`
- **RENAMED** all `data-testid="right-panel-*"` to `data-testid="sidebar-*"`
- **RENAMED** all `data-testid="right-filter-*"` to `data-testid="sidebar-filter-*"`
- **SPLIT** `Sidebar` component into subcomponents to stay under 200 lines
- **MODIFIED** integration test helpers to use new testid selectors
- **MODIFIED** `app-shell-navigation` spec to use "sidebar" terminology

## Goals

- G1: All naming consistently uses "sidebar" instead of "right panel"
- G2: `Sidebar` component and subcomponents each stay under 200 lines

## Non-Goals

- NG1: No behavior changes — this is a pure rename + split refactoring
- NG2: No new features or UI changes
- NG3: No refactoring of `InboxPage.tsx` (separate change)
- NG4: No new BDD tests for sidebar behavior (separate change: `add-sidebar-specs`)

## Users & Scenarios

- U1: Developer reading the code — finds `Sidebar` and immediately understands it can be on either side
- U2: Developer searching codebase — `grep Sidebar` finds all sidebar-related code without false positives from "right"

## Requirements

### Functional

- FR1: Component `RightFilterPanel` is renamed to `Sidebar` with file `Sidebar.tsx`
- FR2: Type `RightPanelMode` is renamed to `SidebarMode`
- FR3: Hook `useRightPanelNavigation` is renamed to `useSidebarNavigation` with file `useSidebarNavigation.ts`
- FR4: All `data-testid` attributes use `sidebar-` prefix instead of `right-panel-` and `right-filter-`
- FR5: `Sidebar.tsx` is split into subcomponents, each under 200 lines
- FR6: All imports across the codebase are updated to new names
- FR7: Integration test helpers use new `data-testid` selectors
- FR8: No runtime behavior changes — identical rendering and interaction

### Non-Functional

#### Performance

- NFR-P1: No additional re-renders introduced by the refactoring

#### Accessibility

- NFR-A1: All `aria-label` values remain unchanged (they already use i18n, not "right")

## UX Acceptance Criteria

- UX1: The app looks and behaves identically before and after the refactoring

## Behavior

No new feature files. Existing tests must pass with updated imports/selectors.

## Visual Reference

No visual changes.

## Affected IA

No changes.

## Success Metrics

- M1: Zero occurrences of `RightFilterPanel`, `RightPanelMode`, `useRightPanelNavigation` in `packages/` after refactoring
- M2: Zero `data-testid` values starting with `right-panel-` or `right-filter-` in `packages/`
- M3: All existing tests pass (unit, integration)
- M4: No file in `packages/client/src/components/tasks/` exceeds 400 lines

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-navigation`: Requirement about "right panel login button" (last requirement in spec) updated to use "sidebar" terminology

## Open Questions

None.
