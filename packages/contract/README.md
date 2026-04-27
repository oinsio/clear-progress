# @clear-progress/contract

Shared contract package for Clear Progress GTD app.

## What's inside

- **Domain types** (`WireTask`, `WireGoal`, etc.) — wire-format entities that travel between client and server
- **Protocol types** (`PullRequest`, `PushResponse`, etc.) — sync protocol messages
- **SyncAdapter interface** — port for backend implementations
- **Constants** — shared constants like `API_ACTIONS`, `PUSH_RESULT_STATUS`, `SYNC_META_KEYS`

## Usage

```typescript
import type { SyncAdapter, PullRequest, PullResponse } from "@clear-progress/contract";

class MyAdapter implements SyncAdapter {
  async pull(request: PullRequest): Promise<PullResponse> {
    // implementation
  }
  // ... other methods
}
```

## Wire types vs Client types

Wire types (`WireTask`, `WireGoal`, etc.) use plain strings for timestamps and dates:
- `created_at: string` (ISO 8601 timestamp)
- `next_date: string` (ISO date or empty string)

Client types extend wire types with:
- Branded types (`ISOTimestamp`, `ISODate`)
- Client-only fields (`needsSync: boolean`)

## Building

```bash
pnpm build
```
