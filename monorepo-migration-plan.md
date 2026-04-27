# Monorepo Migration Plan

Migration from `frontend/` + `backend/` to pnpm workspaces monorepo with shared contract package.

**Goal:** Support multiple interchangeable backends (GAS, Supabase, future adapters) with a shared contract, contract tests, and open-source contributor workflow.

---

## Current Structure

```
clear-progress-gtd/
├── frontend/          # React PWA (own package.json, no workspace)
├── backend/           # Google Apps Script (own package.json, no workspace)
├── docs/
├── .claude/
├── biome.json         # shared
└── CLAUDE.md
```

**Key problems:**
- Types duplicated between `frontend/src/types/` and `backend/src/types/`
- No shared contract — adding a new backend means re-implementing types from scratch
- `ApiClient` is a concrete class, not an interface — `SyncService` is tightly coupled to GAS

---

## Target Structure

```
clear-progress-gtd/
├── packages/
│   ├── contract/                  # @clear-progress/contract
│   │   ├── src/
│   │   │   ├── domain/            # WireTask, WireGoal, Box, GoalStatus...
│   │   │   ├── protocol/          # PullRequest, PushResponse...
│   │   │   ├── ports/             # SyncAdapter interface
│   │   │   └── index.ts
│   │   └── tests/contracts/       # syncAdapterContract() factory
│   │
│   ├── client/                    # @clear-progress/client (ex frontend/)
│   │   ├── src/
│   │   │   ├── types/             # Task (extends WireTask + needsSync), branded types
│   │   │   ├── services/          # SyncService(SyncAdapter), TaskService...
│   │   │   ├── db/                # Dexie, repositories
│   │   │   ├── components/
│   │   │   └── ...
│   │   └── package.json           # deps: @clear-progress/contract
│   │
│   ├── adapter-gas/               # @clear-progress/adapter-gas
│   │   ├── src/
│   │   │   ├── server/            # GAS code (doGet/doPost, sheets, helpers)
│   │   │   └── client/            # GasSyncAdapter implements SyncAdapter
│   │   └── package.json           # deps: @clear-progress/contract
│   │
│   └── adapter-inmemory/          # @clear-progress/adapter-inmemory
│       ├── src/
│       │   └── in-memory-sync-adapter.ts
│       └── tests/
│           └── contract.test.ts
│
├── docs/
│   └── contributing/
│       └── how-to-add-adapter.md
├── .claude/
├── biome.json
├── tsconfig.base.json
├── pnpm-workspace.yaml
├── package.json                   # root scripts
└── CLAUDE.md
```

---

## Phase 0: Foundation (non-breaking)

### 0.1. Create pnpm workspace config

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

### 0.2. Create root package.json

```json
{
  "name": "clear-progress-gtd",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter @clear-progress/client dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "pnpm -r typecheck",
    "test:mutation": "pnpm -r test:mutation",
    "preflight": "pnpm lint && pnpm typecheck && pnpm test"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.13",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### 0.3. Create tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Exit criteria:** `pnpm install` works, no regressions.

---

## Phase 1: Move Folders

### 1.1. `frontend/` -> `packages/client/`

- Update `package.json`: `name: "@clear-progress/client"`
- Update `tsconfig.json`: `extends: "../../tsconfig.base.json"`
- Update biome paths (remove `--config-path=../biome.json`, root biome.json applies automatically in workspace)
- Update vite.config.ts if needed

### 1.2. `backend/` -> `packages/adapter-gas/`

- Update `package.json`: `name: "@clear-progress/adapter-gas"`
- Update `tsconfig.json`: `extends: "../../tsconfig.base.json"`
- Update esbuild.config.mjs paths if needed

### 1.3. Update all references

- Root `CLAUDE.md`: `frontend/` -> `packages/client/`, `backend/` -> `packages/adapter-gas/`
- `.claude/docs/` references
- `.gitignore` paths
- Any CI scripts

### 1.4. Verify

- `pnpm install` from root
- `pnpm test` passes in both packages
- `pnpm build` produces working artifacts
- `pnpm lint` clean

**Exit criteria:** All tests green, build works, dev server starts.

---

## Phase 2: Contract Package

### 2.1. Create `packages/contract/`

```
packages/contract/
├── src/
│   ├── domain/
│   │   ├── common.ts              # Box, GoalStatus
│   │   ├── task.ts                # WireTask
│   │   ├── goal.ts                # WireGoal
│   │   ├── context.ts             # WireContext
│   │   ├── category.ts            # WireCategory
│   │   ├── idea.ts                # WireIdea
│   │   ├── checklist-item.ts      # WireChecklistItem
│   │   ├── setting.ts             # WireSetting
│   │   └── index.ts               # re-exports
│   ├── protocol/
│   │   ├── pull.ts                # PullRequest, PullResponse
│   │   ├── push.ts                # PushRequest, PushResponse, PushItemResult, PushSettingResult
│   │   ├── cover.ts               # UploadCoverRequest/Response, GetCoverResponse, etc.
│   │   ├── ping.ts                # PingResponse, InitResponse
│   │   ├── purge.ts               # PurgeResponse
│   │   └── index.ts
│   ├── ports/
│   │   └── sync-adapter.ts        # SyncAdapter interface
│   ├── constants.ts               # Shared constants (PUSH_RESULT_STATUS, MAX_COVER_SIZE_BYTES, etc.)
│   └── index.ts                   # Public API
├── tests/
│   └── contracts/
│       ├── sync-adapter.contract.ts
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 2.2. Wire-format entity types

These are the types that travel between client and server. No `needsSync`, no branded types — plain strings for timestamps.

```typescript
// packages/contract/src/domain/common.ts
export type Box = "inbox" | "today" | "week" | "later";
export type GoalStatus = "planning" | "in_progress" | "paused" | "completed" | "cancelled";
export type PushResultStatus = "created" | "accepted" | "conflict" | "rejected";
```

```typescript
// packages/contract/src/domain/task.ts
import type { Box } from "./common";

export interface WireTask {
  id: string;
  name: string;
  description: string;
  box: Box;
  goal_id: string;
  context_id: string;
  category_id: string;
  is_completed: boolean;
  completed_at: string;    // ISOTimestamp or ""
  repeat_rule: string;     // JSON string
  is_hidden: boolean;
  next_date: string;       // ISODate or ""
  appear_date: string;     // ISODate or ""
  original_task_id: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  revision: number;
}
```

Similar for WireGoal, WireContext, WireCategory, WireIdea, WireChecklistItem, WireSetting.

### 2.3. Protocol types

Move from `frontend/src/types/api.ts` to `packages/contract/src/protocol/`.

Replace `Omit<Task, "needsSync">` with `WireTask` (they're equivalent).

Remove `ApiRequestPayload` — that's a GAS transport detail (action routing via JSON body), stays in adapter-gas.

```typescript
// packages/contract/src/protocol/pull.ts
import type { WireTask, WireGoal, ... } from "../domain";

export interface PullRequest {
  since_revision: number;
  settings_updated_at?: string;
}

export interface PullResponse {
  ok: boolean;
  tasks: WireTask[];
  goals: WireGoal[];
  contexts: WireContext[];
  categories: WireCategory[];
  ideas: WireIdea[];
  checklist_items: WireChecklistItem[];
  settings: WireSetting[];
  current_revision: number;
  purge_revision: number;
  server_time: string;
}
```

### 2.4. SyncAdapter port

```typescript
// packages/contract/src/ports/sync-adapter.ts
import type { PullRequest, PullResponse } from "../protocol/pull";
import type { PushRequest, PushResponse } from "../protocol/push";
import type { PingResponse, InitResponse } from "../protocol/ping";
import type {
  UploadCoverRequest, UploadCoverResponse,
  UploadCoversRequest, UploadCoversResponse,
  GetCoverResponse, DeleteCoverResponse,
} from "../protocol/cover";
import type { PurgeResponse } from "../protocol/purge";

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

### 2.5. Shared constants

Move from `frontend/src/constants/index.ts` to contract only the constants relevant to the protocol:
- `PUSH_RESULT_STATUS`
- `MAX_COVER_SIZE_BYTES`, `MAX_COVER_BATCH_SIZE`
- `SYNC_META_KEYS`
- `API_ACTIONS` (the action names)

UI constants (ROUTES, STORAGE_KEYS, BOX_ORDER, accent colors, animation durations, etc.) stay in client.

### 2.6. Package configuration

```json
{
  "name": "@clear-progress/contract",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./contracts": {
      "types": "./dist/tests/contracts/index.d.ts",
      "import": "./dist/tests/contracts/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc --noEmit"
  }
}
```

**Exit criteria:** `pnpm build` in contract succeeds, types are importable.

---

## Phase 3: Refactor Client

### 3.1. Add dependency

```json
// packages/client/package.json
"dependencies": {
  "@clear-progress/contract": "workspace:*",
  // ... existing deps
}
```

### 3.2. ApiClient implements SyncAdapter

```typescript
// packages/client/src/services/ApiClient.ts
import type { SyncAdapter } from "@clear-progress/contract";

export class GasApiClient implements SyncAdapter {
  // ... existing implementation unchanged
  // Auth logic (sharedAccessToken, ApiAuthError) stays here — GAS-specific
}
```

Note: `GasApiClient` will later move to `adapter-gas`. For now it stays in client to minimize changes.

### 3.3. SyncService accepts SyncAdapter interface

```typescript
// packages/client/src/services/SyncService.ts
import type { SyncAdapter } from "@clear-progress/contract";

export class SyncService {
  constructor(
    private readonly syncAdapter: SyncAdapter, // was: apiClient: ApiClient
    // ... rest unchanged
  ) {}
}
```

### 3.4. Replace protocol type imports

All files importing from `@/types/api`:
- Change to `import { PullRequest, PushResponse, ... } from "@clear-progress/contract"`
- Delete `frontend/src/types/api.ts` (moved to contract)

### 3.5. Replace shared type imports

Files importing `Box`, `GoalStatus`, `PushResultStatus` from `@/types/common`:
- Change to `import { Box, GoalStatus, ... } from "@clear-progress/contract"`
- Keep `RepeatRule`, `Clock`, UI types (`SyncStatus`, `AccentColor`, etc.) in `@/types/common`

### 3.6. Update constants imports

Files using protocol-related constants:
- Import from `@clear-progress/contract` instead of `@/constants`
- Keep UI constants in `@/constants`

### 3.7. Client entity types extend wire types

```typescript
// packages/client/src/types/entities.ts
import type { WireTask, WireGoal, ... } from "@clear-progress/contract";

export type ISOTimestamp = string & { readonly __brand: "ISOTimestamp" };
export type ISODate = string & { readonly __brand: "ISODate" };

export interface Task extends WireTask {
  // Override string fields with branded versions
  completed_at: ISOTimestamp | "";
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  next_date: ISODate | "";
  appear_date: ISODate | "";
  // Add client-only field
  needsSync: boolean;
}
// ... similar for Goal, Context, etc.
```

### 3.8. Verify

- All tests pass
- Build succeeds
- No runtime behavior changes

**Exit criteria:** `pnpm test`, `pnpm build` green. ApiClient implements SyncAdapter. SyncService depends on SyncAdapter interface.

---

## Phase 4: Refactor adapter-gas

### 4.1. Restructure into server/ + client/

```
packages/adapter-gas/
├── src/
│   ├── server/                    # GAS code (deployed via clasp)
│   │   ├── main.ts                # doGet/doPost (existing)
│   │   ├── actions/               # ping, init, pull, push, ... (existing)
│   │   ├── sheets/                # Google Sheets operations (existing)
│   │   ├── helpers/               # auth, response, drive, constants (existing)
│   │   └── types/                 # server-internal types (existing backend types)
│   └── client/                    # HTTP wrapper for frontend
│       ├── gas-sync-adapter.ts    # implements SyncAdapter
│       └── index.ts
├── tests/
│   ├── server/                    # existing backend unit tests
│   └── contract.test.ts           # contract tests (Phase 5)
├── esbuild.config.mjs             # builds server/ only
├── appsscript.json
├── package.json
└── tsconfig.json
```

### 4.2. Move GasApiClient from client to adapter-gas

Move `packages/client/src/services/ApiClient.ts` -> `packages/adapter-gas/src/client/gas-sync-adapter.ts`.

This includes:
- The HTTP request logic (single GAS endpoint, action routing, Content-Type: text/plain)
- Token management (`sharedAccessToken`, `sharedTokenExpiresAt`, `ApiAuthError`)
- `API_TIMEOUT_MS` constant

### 4.3. Client imports adapter

```json
// packages/client/package.json
"dependencies": {
  "@clear-progress/contract": "workspace:*",
  "@clear-progress/adapter-gas": "workspace:*",
  // ...
}
```

```typescript
// packages/client/src/services/defaultServices.ts
import { GasSyncAdapter } from "@clear-progress/adapter-gas";
import type { SyncAdapter } from "@clear-progress/contract";

function createSyncAdapter(config: ConnectionConfig): SyncAdapter {
  if (config.type === "gas") {
    return new GasSyncAdapter(config.url, getAccessToken);
  }
  // Future: if (config.type === "supabase") { ... }
  throw new Error(`Unknown backend type: ${config.type}`);
}
```

### 4.4. Server code stays independent

`server/` doesn't import from `@clear-progress/contract` — GAS can't use npm modules at runtime. Server types remain internal. The esbuild config only bundles `server/main.ts`.

### 4.5. Add adapter dependency on contract

```json
// packages/adapter-gas/package.json
"dependencies": {
  "@clear-progress/contract": "workspace:*"
}
```

### 4.6. Verify

- `pnpm build` in adapter-gas produces both server bundle and client types
- Client still works with GasSyncAdapter
- All tests green

**Exit criteria:** Clean separation of server (GAS) and client (SyncAdapter) code. Frontend uses adapter via interface.

---

## Phase 5: InMemory Adapter + Contract Tests

### 5.1. Create `packages/adapter-inmemory/`

```typescript
// packages/adapter-inmemory/src/in-memory-sync-adapter.ts
import type {
  SyncAdapter, WireTask, WireGoal, ...,
  PullRequest, PullResponse, PushRequest, PushResponse,
} from "@clear-progress/contract";

export class InMemorySyncAdapter implements SyncAdapter {
  private tasks: WireTask[] = [];
  private goals: WireGoal[] = [];
  // ... all entity stores
  private nextRevision = 1;
  private purgeRevision = 0;
  private initialized = false;

  async ping() {
    return { ok: true, initialized: this.initialized };
  }

  async init() {
    this.initialized = true;
    return { ok: true };
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    return {
      ok: true,
      tasks: this.tasks.filter(t => t.revision > request.since_revision),
      // ... same for other entities
      current_revision: this.nextRevision - 1,
      purge_revision: this.purgeRevision,
      server_time: new Date().toISOString(),
    };
  }

  async push(request: PushRequest): Promise<PushResponse> {
    const revision = this.nextRevision++;
    // Process each entity type
    // Last-write-wins conflict resolution by updated_at
    // Assign revision to accepted records
    // Return results with status per record
  }

  // ... uploadCover, getCover, deleteCover, purge
}
```

### 5.2. Contract test factory

```typescript
// packages/contract/tests/contracts/sync-adapter.contract.ts
import { describe, it, expect, beforeEach } from "vitest";
import type { SyncAdapter } from "../../src/ports/sync-adapter";

export function syncAdapterContract(
  setup: () => Promise<SyncAdapter>,
  teardown?: () => Promise<void>,
) {
  describe("SyncAdapter contract", () => {
    let adapter: SyncAdapter;

    beforeEach(async () => {
      adapter = await setup();
    });

    afterEach(async () => {
      await teardown?.();
    });

    // --- Lifecycle ---

    it("ping returns ok:true and initialized:false before init", async () => {
      const response = await adapter.ping();
      expect(response.ok).toBe(true);
      expect(response.initialized).toBe(false);
    });

    it("init returns ok:true", async () => {
      const response = await adapter.init();
      expect(response.ok).toBe(true);
    });

    it("ping returns initialized:true after init", async () => {
      await adapter.init();
      const response = await adapter.ping();
      expect(response.initialized).toBe(true);
    });

    it("init is idempotent", async () => {
      await adapter.init();
      const response = await adapter.init();
      expect(response.ok).toBe(true);
    });

    // --- Pull (empty state) ---

    it("pull returns empty arrays for fresh state", async () => {
      await adapter.init();
      const response = await adapter.pull({ since_revision: 0 });
      expect(response.ok).toBe(true);
      expect(response.tasks).toEqual([]);
      expect(response.goals).toEqual([]);
      expect(response.current_revision).toBe(0);
      expect(response.purge_revision).toBe(0);
    });

    // --- Push + Pull round-trip ---

    it("pushed task is returned by pull", async () => {
      await adapter.init();
      const task = createWireTask({ name: "Test task" });
      await adapter.push({ tasks: [task] });

      const pullResponse = await adapter.pull({ since_revision: 0 });
      expect(pullResponse.tasks).toHaveLength(1);
      expect(pullResponse.tasks[0].name).toBe("Test task");
    });

    it("push assigns revision to accepted records", async () => {
      await adapter.init();
      const task = createWireTask({ name: "Test" });
      const pushResponse = await adapter.push({ tasks: [task] });

      expect(pushResponse.results.tasks?.[0].status).toBe("created");
      expect(pushResponse.revision).toBeGreaterThan(0);
    });

    it("pull with since_revision filters old records", async () => {
      await adapter.init();

      // Push first task
      const task1 = createWireTask({ name: "Task 1" });
      const push1 = await adapter.push({ tasks: [task1] });
      const rev1 = push1.revision;

      // Push second task
      const task2 = createWireTask({ name: "Task 2" });
      await adapter.push({ tasks: [task2] });

      // Pull only new records
      const response = await adapter.pull({ since_revision: rev1 });
      expect(response.tasks).toHaveLength(1);
      expect(response.tasks[0].name).toBe("Task 2");
    });

    // --- Conflict resolution ---

    it("push detects conflict (last-write-wins by updated_at)", async () => {
      await adapter.init();

      const task = createWireTask({ name: "Original", updated_at: "2026-01-01T00:00:00.000Z" });
      await adapter.push({ tasks: [task] });

      // Server updates the task
      const serverUpdate = { ...task, name: "Server version", updated_at: "2026-01-02T00:00:00.000Z" };
      await adapter.push({ tasks: [serverUpdate] });

      // Client tries to push stale version
      const staleUpdate = { ...task, name: "Client version", updated_at: "2026-01-01T12:00:00.000Z" };
      const response = await adapter.push({ tasks: [staleUpdate] });

      expect(response.results.tasks?.[0].status).toBe("conflict");
      expect(response.results.tasks?.[0].server_record).toBeDefined();
    });

    // --- Covers ---

    it("uploadCover returns file_id", async () => {
      await adapter.init();
      const response = await adapter.uploadCover({
        goal_id: "goal-1",
        filename: "cover.jpg",
        mime_type: "image/jpeg",
        data: btoa("fake-image-data"),
        data_hash: "abc123",
      });
      expect(response.ok).toBe(true);
      expect(response.file_id).toBeDefined();
    });

    // --- Purge ---

    it("purge removes soft-deleted records", async () => {
      await adapter.init();

      const task = createWireTask({ name: "To delete", is_deleted: true });
      await adapter.push({ tasks: [task] });

      const purgeResponse = await adapter.purge();
      expect(purgeResponse.ok).toBe(true);
      expect(purgeResponse.purged.tasks).toBe(1);

      // Verify deleted
      const pullResponse = await adapter.pull({ since_revision: 0 });
      expect(pullResponse.tasks).toHaveLength(0);
    });
  });
}
```

### 5.3. Run contract tests

```typescript
// packages/adapter-inmemory/tests/contract.test.ts
import { syncAdapterContract } from "@clear-progress/contract/contracts";
import { InMemorySyncAdapter } from "../src";

syncAdapterContract(async () => new InMemorySyncAdapter());
```

```typescript
// packages/adapter-gas/tests/contract.test.ts (manual/CI with credentials)
import { syncAdapterContract } from "@clear-progress/contract/contracts";
import { GasSyncAdapter } from "../src/client";

syncAdapterContract(
  async () => {
    const adapter = new GasSyncAdapter(process.env.TEST_GAS_URL!, () => process.env.TEST_TOKEN!);
    return adapter;
  },
);
```

### 5.4. Use inmemory in client tests

```json
// packages/client/package.json
"devDependencies": {
  "@clear-progress/adapter-inmemory": "workspace:*",
}
```

**Exit criteria:** Contract test factory exists, inmemory adapter passes all contract tests. GAS adapter contract tests runnable with credentials.

---

## Phase 6: Infrastructure & Documentation

### 6.1. Update CLAUDE.md files

Root CLAUDE.md:
- Update structure description
- Reference new packages
- Update commands (`pnpm dev`, `pnpm test`, `pnpm --filter @clear-progress/client test`)

Create `packages/contract/README.md`, update `packages/client/CLAUDE.md`, `packages/adapter-gas/CLAUDE.md`.

### 6.2. Contributing guide

`docs/contributing/how-to-add-adapter.md`:
- Copy adapter-inmemory as starting point
- Implement SyncAdapter interface
- Run contract tests
- PR checklist

### 6.3. Extend ConnectionConfig for future backends

```typescript
// packages/client/src/types/connection.ts
export type BackendType = "gas" | "supabase";

export interface GasConnectionConfig {
  type: "gas";
  url: string;
  clientId?: string;
  isActive: boolean;
}

export interface SupabaseConnectionConfig {
  type: "supabase";
  url: string;
  anonKey: string;
  isActive: boolean;
}

export type ConnectionConfig = GasConnectionConfig | SupabaseConnectionConfig;
```

### 6.4. CI workflows (when needed)

```yaml
# .github/workflows/ci.yml
- pnpm install
- pnpm lint
- pnpm typecheck
- pnpm build
- pnpm test
```

**Exit criteria:** Documentation updated, contributor workflow documented, project ready for adapter-supabase.

---

## Risk Assessment

| Phase | Risk | Mitigation |
|---|---|---|
| 0. Workspace | Minimal — additive | Revert single commit |
| 1. Move folders | Medium — path breakage | Search-replace, verify all imports |
| 2. Contract | Low — new code only | No existing code changes |
| 3. Client refactor | Medium — many import changes | Incremental: types first, then services |
| 4. GAS adapter | Medium — split existing code | Keep server code unchanged, only move ApiClient |
| 5. InMemory + tests | Low — new code | Contract tests validate correctness |
| 6. Docs | Minimal | — |

Each phase is a separate PR. Project is fully functional after each phase.

---

## Key Design Decisions

1. **SyncAdapter, not per-entity repositories.** The contract reflects the actual sync protocol (pull/push), not generic CRUD. This matches how the system works.

2. **Wire types (`WireTask`) separate from client types (`Task`).** Client extends wire types with `needsSync` and branded types. This keeps the contract clean while preserving client-side type safety.

3. **GAS server code stays independent.** It can't import from contract at runtime (GAS doesn't support npm modules). Server types remain internal to the adapter.

4. **ApiRequestPayload is GAS-specific.** The `{ action, token, data }` envelope is a GAS transport detail, not part of the contract. Supabase will use a completely different transport.

5. **Auth is adapter-specific.** `ApiAuthError`, token management, `Content-Type: text/plain` — all GAS-specific. Each adapter handles auth its own way.
