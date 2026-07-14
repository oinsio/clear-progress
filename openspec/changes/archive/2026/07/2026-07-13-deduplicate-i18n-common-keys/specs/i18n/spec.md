## ADDED Requirements

### Requirement: Common namespace for shared UI labels

Locale files SHALL contain a `common` top-level namespace with shared UI labels that are used identically across multiple domain namespaces. Components SHALL reference `common.*` keys instead of duplicating the same label under each domain namespace.

The `common` namespace SHALL include at minimum: `cancel`, `back`, `delete`, `close`, `next`, `save`, `loading`, `name`, `taskCount`, `details`, `attachments`.

#### Scenario: Component uses common.cancel instead of domain-specific key
- **WHEN** a component needs a "Cancel" button label
- **THEN** it SHALL use `t("common.cancel")` instead of a domain-specific key like `t("goal.cancel")`

#### Scenario: Common keys exist in all locale files
- **WHEN** `en.json` contains `common.cancel`
- **THEN** `ru.json` SHALL also contain `common.cancel` with the corresponding translation

#### Scenario: Domain-specific keys replaced by common keys are removed
- **WHEN** `common.cancel` is defined
- **THEN** keys `task.cancel`, `goal.cancel`, `focusGoalReplacementDialog.cancel`, `idea.deleteConfirmCancel`, `settings.fullSyncCancel`, `settings.disconnectCancel`, `settings.server.cancel`, `taskEdit.deleteConfirmCancel`, `deleted.purgeCancel`, `confirmDialog.cancel` SHALL NOT exist in locale files

#### Scenario: saveName keys replaced by common.saveName
- **WHEN** `common.saveName` is defined
- **THEN** keys `context.saveName` and `category.saveName` SHALL NOT exist in locale files
- **AND** `EntityDetailLayout` consumers (`ContextDetailPage`, `CategoryDetailPage`) SHALL pass `"common.saveName"` via `i18nKeys.saveName`
