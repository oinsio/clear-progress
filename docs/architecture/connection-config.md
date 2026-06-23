# Connection Architecture: ConnectionConfig

## Problem

Previously, backend connection was stored in several separate localStorage keys. This led to:

- Key desynchronization (ghost config after disconnect)
- Two "Disconnect" buttons with different behavior (SetupPage vs SettingsPage)
- Dead end in `not_initialized` state without credentials (no "Back" button)
- SetupPage showing "connected" after disconnect (checking wrong key)

## Solution: Single `ConnectionConfig` Object

One serialized object in localStorage instead of separate keys:

```ts
// src/types/connection.ts
type SupabaseConnectionConfig = {
  type: "supabase";
  url: string;
  anonKey: string;
  isActive: boolean;  // true = connected, false = disconnected (but preserved)
};

type ConnectionConfig = SupabaseConnectionConfig;
// Future: | FirebaseConnectionConfig | PocketBaseConnectionConfig
```

**Single key:** `STORAGE_KEYS.CONNECTION_CONFIG` -> `JSON.stringify(ConnectionConfig)` or absent.

### The `isActive` Field

Mandatory `isActive: boolean` field:
- `true` — active connection (user is connected)
- `false` — inactive connection (user disconnected, but credentials are preserved for reconnection)

On disconnect (`disconnect()`), config is not deleted but updated with `isActive: false`. This allows pre-filling fields on SetupPage when reconnecting to the same server.

### Benefits

- Single source of truth -> impossible to desynchronize keys
- `type` discriminant -> SetupPage/SyncProvider/ApiClient know which backend
- Adding a new backend = new type in union + new section on SetupPage
- `disconnect()` = one `removeItem` instead of five

## Key Components

### `connectionService.ts` — single management point

- `connect(config)` — saves config with `isActive: true`, dispatches events
- `disconnect()` — updates config with `isActive: false` (does not delete), removes auth/sync keys, dispatches events
- `getConnectionConfig()` — reads and parses from localStorage, returns `null` for inactive configs (`isActive: false`)
- `getSavedConnectionConfig()` — reads config regardless of `isActive` (for pre-filling SetupPage fields)
- `getBackendType()` — shortcut for `config?.type`

### `useConnectionConfig` Hook

- Reactive hook, listens to `BACKEND_CONNECTION_EVENT` and storage events
- Returns `ConnectionConfig | null`
- Replaces `useBackendConnected` (which becomes a wrapper: `useConnectionConfig() !== null`)

### `useConnectionStatus` — adapted

Uses `useConnectionConfig()` instead of separate checks:
- `!config` -> `"not_configured"`
- Then maps to sync statuses

## Adding a New Backend

1. Add new type to union `ConnectionConfig` (e.g., `FirebaseConnectionConfig`)
2. Add connection form on SetupPage
3. Add sync strategy in SyncProvider (`switch` on `config.type`)
4. Add API client or adapter

No changes needed in `connectionService`, `useConnectionConfig`, `useConnectionStatus`, disconnect flow.
