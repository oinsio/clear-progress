# add-sidebar-specs

## Why

The sidebar is a core navigation element used on every page, but it has no OpenSpec capability spec and no BDD tests. Its behaviors (toggle, side switching, always-open mode, mode selection, menu order, sync status display) are only partially covered by ad-hoc unit tests in `RightFilterPanel.test.tsx`. This makes it hard to verify correctness, plan changes, and catch regressions.

This change assumes `rename-right-panel-to-sidebar` is completed first (component is already named `Sidebar`).

## What Changes

- **ADDED** new `sidebar-navigation` capability spec covering all sidebar behaviors
- **ADDED** BDD unit feature files for sidebar toggle, mode switching, side placement, always-open mode
- **ADDED** BDD unit step definitions implementing the feature files
- **MODIFIED** `app-shell-navigation` to move sidebar-related requirements to the new `sidebar-navigation` capability

## Goals

- G1: Every sidebar behavior has a formal spec with testable scenarios
- G2: BDD unit tests cover sidebar toggle, mode switching, side placement, always-open mode, sync status display
- G3: Mutation testing score >= 95% on sidebar-related code

## Non-Goals

- NG1: No behavior changes — only adding specs and tests for existing behavior
- NG2: No E2E tests — BDD unit tests only (E2E can be added later)
- NG3: No refactoring of sidebar component structure
- NG4: No coverage of `usePanelSplit` (resize) — that's a detail panel concern, not sidebar

## Users & Scenarios

- U1: Developer modifying sidebar — reads spec to understand expected behaviors, runs BDD tests to verify changes
- U2: AI agent implementing sidebar changes — uses spec as ground truth for what the sidebar should do

## Requirements

### Functional

- FR1: Create `openspec/specs/sidebar-navigation/spec.md` covering: toggle open/close, expanded vs collapsed rendering, side placement (left/right), always-open mode, mode selection, filter items from menu order, sync status display, focused goals block, search button
- FR2: Create BDD unit feature file for sidebar toggle behavior (open/close, always-open override, collapsed strip rendering)
- FR3: Create BDD unit feature file for sidebar mode switching (mode selection, route navigation for modes with routes, toggle off active mode)
- FR4: Create BDD unit feature file for sidebar side placement (left/right layout, border direction, element order)
- FR5: Create BDD unit feature file for sidebar sync status (synced, syncing, offline, error, not configured, unauthorized)
- FR6: Create step definitions for all BDD feature files
- FR7: Move sidebar-related requirement from `app-shell-navigation` spec to `sidebar-navigation` spec

### Non-Functional

#### Performance

- NFR-P1: BDD unit tests execute in under 5 seconds total

#### Accessibility

- NFR-A1: Spec scenarios verify correct `aria-label`, `aria-pressed`, and `role` attributes

## UX Acceptance Criteria

- UX1: No UI changes — tests verify existing behavior only

## Behavior

Feature files:
- `features/sidebar/sidebar_toggle.feature` — @add-sidebar-specs @FR2
- `features/sidebar/sidebar_mode.feature` — @add-sidebar-specs @FR3
- `features/sidebar/sidebar_side.feature` — @add-sidebar-specs @FR4
- `features/sidebar/sidebar_sync.feature` — @add-sidebar-specs @FR5

## Visual Reference

No visual changes.

## Affected IA

No changes.

## Success Metrics

- M1: `sidebar-navigation` capability spec exists with >= 10 requirements covering all sidebar behaviors
- M2: >= 4 BDD feature files with step definitions, all passing
- M3: Mutation testing score >= 95% on sidebar component code (minimum acceptable >= 90%)
- M4: Zero sidebar behaviors undocumented in spec

## Capabilities

### New Capabilities

- `sidebar-navigation`: Sidebar panel behaviors — toggle, mode selection, side placement, always-open mode, sync status, menu order filtering, focused goals, search

### Modified Capabilities

- `app-shell-navigation`: Move sidebar login button requirement to `sidebar-navigation` capability (it belongs there, not in app shell)

## Open Questions

None.
