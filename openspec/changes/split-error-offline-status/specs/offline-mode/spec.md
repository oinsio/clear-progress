## ADDED Requirements

### Requirement: Offline status displays dedicated UI text
When connection status is `offline`, the UI SHALL display the `sync.noConnection` i18n key exclusively for this status. The text SHALL NOT be shared with the `error` status.

#### Scenario: Offline status shows "No connection" text
- **WHEN** connection status is `offline`
- **THEN** the sync label displays `t("sync.noConnection")`
- **AND** the text is "Нет связи" (ru) or "No connection" (en)

#### Scenario: Offline status shows red indicator in settings
- **WHEN** connection status is `offline`
- **THEN** the status indicator in ServerConnectedStatus is red (`bg-red-500`)
