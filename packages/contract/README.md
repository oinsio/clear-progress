# @clear-progress/contract

Shared contract package defining the sync protocol between client and backend adapters.

## What's inside

- **Domain types** (`WireTask`, `WireGoal`, etc.) — wire-format entities that travel between client and server
- **Protocol types** (`PullRequest`, `PushResponse`, etc.) — sync protocol messages
- **SyncAdapter interface** — port for backend implementations
- **Contract tests** — validation suite for adapter implementations
- **Constants** — shared constants like `API_ACTIONS`, `PUSH_RESULT_STATUS`, `SYNC_META_KEYS`

## Structure

```
packages/contract/
├── src/
│   ├── domain/              # Wire-format entity types
│   ├── protocol/            # Pull/push protocol types
│   ├── ports/               # SyncAdapter interface
│   ├── constants.ts         # Shared constants
│   └── index.ts             # Public API
├── tests/
│   └── contracts/           # Contract test factory
│       ├── sync-adapter.contract.ts
│       └── index.ts
└── README.md
```

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

**Wire types** (`WireTask`, `WireGoal`, etc.) use plain strings:
- Timestamps: `created_at: string` (ISO 8601 with Z suffix)
- Dates: `next_date: string` (ISO date or empty string)
- No client-specific fields (no `needsSync`)

**Client types** (in `@clear-progress/client`) extend wire types:
- Branded types: `ISOTimestamp`, `ISODate`
- Client-only fields: `needsSync: boolean`

## SyncAdapter Interface

All backend adapters must implement `SyncAdapter`:

```typescript
export interface SyncAdapter {
  ping(): Promise<PingResponse>;
  init(): Promise<InitResponse>;
  pull(request: PullRequest): Promise<PullResponse>;
  push(request: PushRequest): Promise<PushResponse>;
  uploadCover(request: UploadCoverRequest): Promise<UploadCoverResponse>;
  uploadCovers(request: UploadCoversRequest): Promise<UploadCoversResponse>;
  getCover(fileIds: string[]): Promise<GetCoverResponse>;
  deleteCover(fileId: string, goalId: string): Promise<DeleteCoverResponse>;
  purge(): Promise<PurgeResponse>;
}
```

## Contract Tests

Use `syncAdapterContract()` factory to validate adapter implementations:

```typescript
import { syncAdapterContract } from "@clear-progress/contract/contracts";
import { MyAdapter } from "../src";

syncAdapterContract(
  async () => new MyAdapter(),
  async () => { /* cleanup */ }
);
```

See `@clear-progress/adapter-inmemory` for reference implementation.

## Adding New Protocol Methods

When adding new methods to `SyncAdapter`:
1. Define request/response types in `src/protocol/`
2. Add method to `SyncAdapter` interface in `src/ports/sync-adapter.ts`
3. Add contract tests in `tests/contracts/sync-adapter.contract.ts`
4. Update all existing adapters (`adapter-gas`, `adapter-inmemory`)
5. Update this documentation

## Building

```bash
pnpm build      # Compile TypeScript
pnpm typecheck  # Type check without emitting
```

## Testing

Contract tests are run by adapter packages, not by this package directly.
