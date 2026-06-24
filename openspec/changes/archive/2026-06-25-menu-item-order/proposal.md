# menu-item-order

## Why

The current default menu order doesn't match the desired information hierarchy. Ideas should appear before Goals (lighter concept before heavier), Memos should be grouped with content sections rather than after Focused Goals, and Focused Goals should be at the bottom as a separate navigational block.

## What Changes

- **MODIFIED**: Default menu item order in `DEFAULT_MENU_MODE_ORDER` and `DEFAULT_MENU_ORDER`
- Old order: inbox, contexts, categories, goals, ideas, tasks, completed, focused_goals, memos, deleted
- New order: inbox, contexts, categories, ideas, goals, tasks, completed, memos, deleted, focused_goals

## Goals

- G1: New users see the improved default menu order on first launch
- G2: Existing users are not affected (their saved order in localStorage is preserved)

## Non-Goals

- NG1: Migrating existing users to the new default order
- NG2: Changing menu item visibility defaults (deleted stays `visible: false`)
- NG3: Changing any menu functionality or UI rendering

## Users & Scenarios

- U1: New user opens the app for the first time and sees the updated default menu order

## Requirements

### Functional

- FR1: `DEFAULT_MENU_MODE_ORDER` must be: inbox, contexts, categories, ideas, goals, tasks, completed, memos, deleted, focused_goals
- FR2: `DEFAULT_MENU_ORDER` must mark `deleted` as `visible: false`, all others as `visible: true`
- FR3: Existing localStorage data must not be overwritten or migrated

### Non-Functional

None — this is a constant value change with no performance, accessibility, or responsive implications.

## UX Acceptance Criteria

- UX1: On a fresh install (no localStorage), the sidebar menu items appear in the new order

## Behavior

No new Gherkin scenarios needed. Existing menu-order specs cover persistence, migration, and reactivity. Only the constant values change.

## Visual Reference

No visual changes — same menu items, different default order.

## Affected IA

No changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menu-order`: Default order constant values change (FR1, FR2)

## Impact

- `packages/client/src/stores/menuOrderStore.ts` — `DEFAULT_MENU_MODE_ORDER` and `DEFAULT_MENU_ORDER` arrays
- Unit tests referencing the default order

## Success Metrics

- M1: Fresh app load (cleared localStorage) shows the new menu order
- M2: Existing users with saved menu order see no change

## Open Questions

None.
