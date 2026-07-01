## MODIFIED Requirements

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
