# How to Add a New Backend Adapter

This guide explains how to create a new backend adapter for Clear Progress.

## Overview

Clear Progress uses a **ports and adapters** architecture. The client depends on the `SyncAdapter` interface from `@clear-progress/contract`, and backend adapters implement this interface.

**Existing adapters:**
- `@clear-progress/adapter-supabase` — Supabase backend
- `@clear-progress/adapter-inmemory` — In-memory storage (for testing)

**Potential future adapters:**
- `@clear-progress/adapter-firebase` — Firebase backend
- `@clear-progress/adapter-pocketbase` — PocketBase backend

## Step-by-Step Guide

### 1. Create Package Structure

```bash
mkdir -p packages/adapter-yourname/{src,tests}
cd packages/adapter-yourname
```

Create `package.json`:

```json
{
  "name": "@clear-progress/adapter-yourname",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@clear-progress/contract": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^4.0.18"
  }
}
```

Create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. Implement SyncAdapter

Create `src/yourname-sync-adapter.ts`:

```typescript
import type {
  SyncAdapter,
  PullRequest, PullResponse,
  PushRequest, PushResponse,
  PingResponse, InitResponse,
  UploadCoverRequest, UploadCoverResponse,
  UploadCoversRequest, UploadCoversResponse,
  GetCoverResponse, DeleteCoverResponse,
  PurgeResponse,
} from "@clear-progress/contract";

export class YournameSyncAdapter implements SyncAdapter {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async ping(): Promise<PingResponse> {
    // Check if backend is reachable and initialized
  }

  async init(): Promise<InitResponse> {
    // Initialize backend storage (create tables, etc.)
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    // Fetch changes since request.since_revision
  }

  async push(request: PushRequest): Promise<PushResponse> {
    // Save changes to backend, return results per record
  }

  async uploadCover(request: UploadCoverRequest): Promise<UploadCoverResponse> {
    // Upload goal cover image
  }

  async uploadCovers(request: UploadCoversRequest): Promise<UploadCoversResponse> {
    // Batch upload covers
  }

  async getCover(fileIds: string[]): Promise<GetCoverResponse> {
    // Download cover images
  }

  async deleteCover(fileId: string, goalId: string): Promise<DeleteCoverResponse> {
    // Delete cover image
  }

  async purge(): Promise<PurgeResponse> {
    // Hard-delete soft-deleted records
  }
}
```

Create `src/index.ts`:

```typescript
export { YournameSyncAdapter } from "./yourname-sync-adapter";
```

### 3. Write Contract Tests

Create `tests/contract.test.ts`:

```typescript
import { syncAdapterContract } from "@clear-progress/contract/contracts";
import { YournameSyncAdapter } from "../src";

syncAdapterContract(
  async () => {
    // Setup: create adapter instance
    const adapter = new YournameSyncAdapter(
      process.env.TEST_API_URL!,
      process.env.TEST_API_KEY!,
    );
    return adapter;
  },
  async () => {
    // Teardown: cleanup test data
  },
);
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

Run tests:

```bash
pnpm test
```

**All contract tests must pass** before proceeding.

### 4. Add Connection Type

Update `/packages/client/src/types/connection.ts`:

```typescript
export type BackendType = "gas" | "yourname";

export interface YournameConnectionConfig {
  type: "yourname";
  apiUrl: string;
  apiKey: string;
  isActive: boolean;
}

export type ConnectionConfig = GasConnectionConfig | YournameConnectionConfig;
```

### 5. Integrate with Client

Update `/packages/client/src/services/defaultServices.ts`:

```typescript
import { YournameSyncAdapter } from "@clear-progress/adapter-yourname";

function createSyncAdapter(): SyncAdapter {
  const config = getConnectionConfig();
  if (config?.type === "gas") {
    return new GasSyncAdapter(config.url, getAccessToken);
  }
  if (config?.type === "yourname") {
    return new YournameSyncAdapter(config.apiUrl, config.apiKey);
  }
  throw new Error("No backend configured");
}
```

Add dependency to `/packages/client/package.json`:

```json
{
  "dependencies": {
    "@clear-progress/adapter-yourname": "workspace:*"
  }
}
```

### 6. Update Documentation

- Add adapter to root `CLAUDE.md` structure section
- Create `packages/adapter-yourname/README.md` with setup instructions
- Update this guide with any adapter-specific notes

### 7. Submit PR

**PR checklist:**
- [ ] All contract tests pass
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Linter passes (`pnpm lint`)
- [ ] README.md created with setup instructions
- [ ] Connection type added to client
- [ ] Integration tested with client

## Key Concepts

### Revision-Based Sync

The sync protocol uses **revision numbers** to track changes:
- Server maintains `next_revision` counter (starts at 1)
- Each accepted record gets assigned current `revision`
- Client tracks `last_known_revision` and requests changes `since_revision`

### Conflict Resolution

Use **last-write-wins** by `updated_at` timestamp:
- If server record has newer `updated_at` → reject client change, return `conflict` status
- If client record has newer `updated_at` → accept change, return `created` or `accepted` status

### Soft Delete

Records are never hard-deleted immediately:
- Set `is_deleted = true` on delete
- Client continues syncing deleted records
- `purge()` action hard-deletes records marked as deleted

### Cover Images

Goal cover images are stored separately from entity data:
- `uploadCover()` returns `file_id` (backend-specific identifier)
- `WireGoal.cover_file_id` stores this identifier
- `getCover()` downloads images by `file_id`
- `deleteCover()` removes image (with ref-counting if needed)

## Reference Implementation

See `@clear-progress/adapter-inmemory` for a complete, minimal implementation.

## Questions?

Open an issue or discussion on GitHub.
