# @clear-progress/contract

Shared contract package for Clear Progress GTD app.

## Purpose

This package defines the protocol between client and backend adapters:
- **Domain types** — wire-format entities (WireTask, WireGoal, etc.)
- **Protocol types** — API request/response shapes (PullRequest, PushResponse, etc.)
- **Ports** — SyncAdapter interface that all backend adapters must implement
- **Constants** — shared constants (API_ACTIONS, PUSH_RESULT_STATUS, etc.)

## Usage

```typescript
import type { SyncAdapter, PullRequest, WireTask } from "@clear-progress/contract";

class MyAdapter implements SyncAdapter {
  async pull(request: PullRequest) {
    // ...
  }
  // ... other methods
}
```

## Wire Types vs Client Types

Wire types (WireTask, WireGoal, etc.) are plain objects with string timestamps:
- `created_at: string` (ISO 8601)
- `updated_at: string` (ISO 8601)
- No `needsSync` field

Client types (Task, Goal, etc.) extend wire types with:
- Branded types (`ISOTimestamp`, `ISODate`)
- `needsSync: boolean` (client-only field)

## Contract Tests

Contract tests ensure adapter implementations comply with the protocol.

See `tests/contracts/sync-adapter.contract.ts` for the test suite factory.

## Building

```bash
pnpm build
```
