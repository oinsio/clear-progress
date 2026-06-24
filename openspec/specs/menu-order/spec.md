# Capability: Menu Order

## Purpose

Manages the order, visibility, and persistence of menu items across different menu modes (e.g., main menu, focused goals). Ensures cross-instance reactivity so all UI consumers stay in sync.

## Requirements

### Requirement: Cross-instance reactivity of menu order

When `setMenuOrder` is called in one instance of the `useMenuOrder` hook, all other instances MUST receive the updated `menuOrder` value in the next React render cycle. Implemented via `useSyncExternalStore` with an external store module.

#### Scenario: Menu order changed in one instance reflected in another
- **WHEN** the first instance of `useMenuOrder` calls `setMenuOrder` with a new order
- **THEN** the second instance of `useMenuOrder` returns the updated `menuOrder`

#### Scenario: Menu item visibility toggled reflected across instances
- **WHEN** the first instance of `useMenuOrder` hides a menu item via `setMenuOrder`
- **THEN** the second instance of `useMenuOrder` returns `menuOrder` with `visible: false` for that item

#### Scenario: Multiple rapid changes all reflected
- **WHEN** the first instance of `useMenuOrder` calls `setMenuOrder` multiple times in rapid succession
- **THEN** the second instance of `useMenuOrder` returns the result of the last call

### Requirement: Store persistence and validation

The external store MUST persist data to localStorage and validate on load via Zod schema. For invalid data, it MUST return the default order. New menu modes MUST be added automatically during migration. The `MenuModeSchema` SHALL include the `"memos"` value. Implements FR12 of add-memos. Default order updated per FR1 of menu-item-order.

#### Scenario: Store persists to localStorage
- **WHEN** `setMenuOrder` is called with a new order
- **THEN** the value is saved to `localStorage` under the key `STORAGE_KEYS.MENU_ORDER`

#### Scenario: Store loads from localStorage on init
- **WHEN** localStorage contains a saved menu order
- **THEN** `getSnapshot()` returns that order (after validation and migration)

#### Scenario: Invalid data falls back to defaults
- **WHEN** localStorage contains invalid data
- **THEN** `getSnapshot()` returns `DEFAULT_MENU_ORDER`

#### Scenario: Missing modes added during migration
- **WHEN** localStorage is missing the `memos` mode
- **THEN** `getSnapshot()` returns an order with `memos` appended at the end

#### Scenario: Default menu order
- **WHEN** app initializes with no saved menu order
- **THEN** `DEFAULT_MENU_ORDER` MUST contain items in order: inbox, contexts, categories, ideas, goals, tasks, completed, memos, deleted, focused_goals
- **AND** `deleted` MUST have `visible: false`
- **AND** all other items MUST have `visible: true`

### Requirement: Store subscriber management

The store MUST support subscribing and unsubscribing. Subscribers MUST be called after each `setMenuOrder`.

#### Scenario: Subscriber notified on change
- **WHEN** a subscriber is registered via `subscribe` and `setMenuOrder` is called
- **THEN** the subscriber's callback is invoked

#### Scenario: Unsubscribed listener not called
- **WHEN** a subscriber unsubscribes via the function returned from `subscribe` and `setMenuOrder` is called
- **THEN** the subscriber's callback is NOT invoked

#### Scenario: Snapshot referential stability
- **WHEN** `getSnapshot()` is called twice without an intervening `setMenuOrder`
- **THEN** both references point to the same object (`===`)
