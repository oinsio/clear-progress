# fix-menu-order-reactivity

## Why

When changing the order or visibility of menu items in the app Settings, changes are not immediately reflected in the right navigation panel (`RightFilterPanel`). The update only occurs when navigating to another page. Since there is no "Save" button in settings, the user expects instant reactivity.

Root cause: the broadcast effect in the `useMenuOrder` hook has an empty dependency array `[]`, so the event is dispatched only on mount, not after each change.

## What Changes

- **MODIFIED**: `useMenuOrder` hook — fix the broadcast mechanism so that the `MENU_ORDER_CHANGED_EVENT` event is dispatched after each `setMenuOrder` call

## Goals

- **G1**: Changing menu item order/visibility in settings is instantly reflected in `RightFilterPanel`

## Non-Goals

- **NG1**: Changing the menu settings UX (drag-and-drop, toggle visibility)
- **NG2**: Adding a "Save" button to settings

## Users & Scenarios

- **U1**: User opens settings, drags a menu item to a new position — the right panel immediately displays the new order
- **U2**: User hides a menu item via toggle — the item immediately disappears from the right panel

## Requirements

### Functional

- **FR1**: When `setMenuOrder` is called, all instances of the `useMenuOrder` hook in other components MUST receive the updated value synchronously (within a single React render cycle)

### Non-Functional

No additional NFRs.

## UX Acceptance Criteria

- **UX1**: When dragging a menu item in settings, the right panel updates instantly (without navigating to another page)
- **UX2**: When toggling menu item visibility, the right panel updates instantly

## Capabilities

### New Capabilities

No new capabilities.

### Modified Capabilities

No changes to requirements. This is a bug in the `useMenuOrder` hook implementation — the capabilities-level specification is not affected.

## Impact

- `packages/client/src/hooks/useMenuOrder.ts` — fix the broadcast mechanism
- `packages/client/src/hooks/useMenuOrder.test.ts` — update/add tests

## Success Metrics

- **M1**: Unit test confirms that a second instance of `useMenuOrder` receives the updated value after `setMenuOrder` is called in the first
- **M2**: Mutation testing score >= 95% for `useMenuOrder.ts`

## Open Questions

No open questions.
