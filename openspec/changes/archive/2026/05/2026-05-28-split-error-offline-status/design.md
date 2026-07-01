## Context

Currently `RightFilterPanel` groups `error` and `offline` into a single `hasSyncError` variable and displays `t("sync.noConnection")` for both. `ServerConnectedStatus` shows a red indicator for both. Driven by FR1, FR2, FR3 from proposal.

## Goals / Non-Goals

**Goals:**
- Split UI display for `error` and `offline` statuses
- Minimal changes: only an i18n key + conditions in two components

**Non-Goals:**
- Changing `SyncStatus` / `ConnectionStatus` types (NG1)
- Changing logic in `SyncProvider` (NG1)
- Detailed error messages (NG2)

## Decisions

### D1: New i18n key `sync.serverError`

Add `sync.serverError` ("Server error" / "Ошибка сервера"). The `sync.noConnection` key stays for `offline`.

**Alternative**: rename `sync.noConnection` to `sync.offline` and add `sync.error`. Rejected — unnecessary breaking change for existing key.

### D2: Orange indicator for `error`

In `ServerConnectedStatus`, error gets `bg-orange-500` (orange), offline stays `bg-red-500` (red). Orange signals "problem, but network is up", red signals "no connection".

**Alternative**: yellow (`bg-yellow-500`). Rejected — yellow is already used for `syncing` (`bg-yellow-400 animate-pulse`).

### D3: Split logic in RightFilterPanel

Replace `hasSyncError` with two separate conditions: `isOffline` and `hasServerError`. The `syncLabel` is built with a ternary operator with three branches.

## Risks / Trade-offs

- **[Existing test compatibility]** → Update BDD connection_status tests that check shared text for error/offline. Low risk — tests are localized.
