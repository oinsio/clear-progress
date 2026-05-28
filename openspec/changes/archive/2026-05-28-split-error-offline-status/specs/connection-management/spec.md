## ADDED Requirements

### Requirement: Error status displays dedicated UI text
When connection status is `error`, the UI SHALL display the `sync.serverError` i18n key. This distinguishes server errors from network unavailability (`offline`).

#### Scenario: Error status shows "Server error" text
- **WHEN** connection status is `error`
- **THEN** the sync label displays `t("sync.serverError")`
- **AND** the text is "Ошибка сервера" (ru) or "Server error" (en)

#### Scenario: Error status shows orange indicator in settings
- **WHEN** connection status is `error`
- **THEN** the status indicator in ServerConnectedStatus is orange (`bg-orange-500`)
- **AND** the indicator is visually distinct from offline (red) and syncing (yellow)
