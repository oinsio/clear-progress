# split-error-offline-status

## Why

The `error` and `offline` statuses both display the same text `sync.noConnection` ("No connection"). Users cannot distinguish a network problem (no internet) from a server problem (backend unreachable). This makes self-diagnosis harder — should they check Wi-Fi or wait for the server to recover?

## What Changes

- **MODIFIED**: UI text for `error` status — show "Server error" instead of "No connection"
- **MODIFIED**: Settings indicator — different colors for `error` (orange) and `offline` (red)

## Goals

- **G1**: User understands within 1 second whether the problem is network or server

## Non-Goals

- **NG1**: Changing status determination logic (SyncStatus type, SyncProvider) — stays as is
- **NG2**: Adding detailed error messages (error codes, retry countdown)

## Users & Scenarios

- **U1**: User without internet sees "No connection" and checks Wi-Fi
- **U2**: User with internet but unreachable server sees "Server error" and waits

## Requirements

### Functional

- **FR1**: When `connectionStatus === "offline"`, display `sync.noConnection` text ("No connection")
- **FR2**: When `connectionStatus === "error"`, display `sync.serverError` text ("Server error")
- **FR3**: In settings (ServerConnectedStatus), indicator for `error` is orange (`bg-orange-500`), for `offline` is red (`bg-red-500`)

### Non-Functional

#### Accessibility

- **NFR-A1**: Status text must be accessible to screen readers via aria-label

## UX Acceptance Criteria

- **UX1**: "No connection" text is displayed only for `offline`, not for `error`
- **UX2**: "Server error" text is displayed only for `error`
- **UX3**: Color indicator in settings: orange for `error`, red for `offline` and `unauthorized`

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `offline-mode`: UI text for offline status is now exclusively "No connection" (previously shared with error)
- `connection-management`: UI text for error status changes to "Server error", indicator color changes to orange

## Impact

- `packages/client/src/locales/en.json` — new key `sync.serverError`
- `packages/client/src/locales/ru.json` — new key `sync.serverError`
- `packages/client/src/components/tasks/RightFilterPanel.tsx` — split error/offline display logic
- `packages/client/src/components/settings/ServerConnectedStatus.tsx` — different colors for error and offline

## Success Metrics

- **M1**: When `error`, "Server error" is displayed; when `offline`, "No connection" is displayed (verified by BDD unit tests)
- **M2**: Indicator color differs between error and offline (verified by unit test)

## Open Questions

(none)
