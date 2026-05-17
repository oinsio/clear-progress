## 1. Package Scaffolding

- [ ] 1.1 Create `packages/integration/package.json` with dependencies: `@playwright/test`, `testcontainers`, `@supabase/supabase-js`
- [ ] 1.2 Create `packages/integration/tsconfig.json` extending root config
- [ ] 1.3 Add `packages/integration` to `pnpm-workspace.yaml` (verify it's covered by `packages/*` glob)
- [ ] 1.4 Run `pnpm install` to link the new package

## 2. Docker Compose Stack

- [ ] 2.1 Create `packages/integration/.env.test` with static JWT secrets (JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY — Supabase local dev defaults)
- [ ] 2.2 Create `packages/integration/docker-compose.yml` with services: db, auth, rest, storage, edge-functions, kong
- [ ] 2.3 Configure db volume mount: `../adapter-supabase/supabase/migrations/` → `/docker-entrypoint-initdb.d/`
- [ ] 2.4 Configure edge-functions volume mount: `../adapter-supabase/supabase/functions/` → `/home/deno/functions/`
- [ ] 2.5 Verify stack starts manually: `docker compose --env-file .env.test up` (smoke test)

## 3. Testcontainers Integration

- [ ] 3.1 Implement `src/config.ts` — types and config reading (test config JSON schema)
- [ ] 3.2 Implement `src/supabase-environment.ts` — DockerComposeEnvironment wrapper with wait strategies
- [ ] 3.3 Implement `src/global-setup.ts` — start environment, create test user via GoTrue admin API, write `.supabase-test-config.json`
- [ ] 3.4 Implement `src/global-teardown.ts` — stop environment, clean up config file

## 4. Playwright Configuration

- [ ] 4.1 Create `packages/integration/playwright.config.ts` with globalSetup/globalTeardown, webServer (client dev), baseURL, timeout 120s
- [ ] 4.2 Install Playwright browsers: `pnpm --filter integration exec playwright install chromium`

## 5. Integration Tests

Tests are written sequentially — each builds on the previous. All in `src/tests/`.

### 5.1 Connection flow (`connection.spec.ts`)
- [ ] 5.1.1 Connect with valid URL + anon key → verify connected status
- [ ] 5.1.2 Connect with invalid URL → verify error state
- [ ] 5.1.3 Connect with invalid key → verify error state

### 5.2 Tasks sync (`tasks-sync.spec.ts`)
- [ ] 5.2.1 Create task locally → push → verify task exists on server (pull returns it)
- [ ] 5.2.2 Modify task (title, status) locally → push → pull on fresh state → verify changes
- [ ] 5.2.3 Soft-delete task locally → push → pull → verify is_deleted=true on server
- [ ] 5.2.4 Create recurring task → push → verify repeat rule persisted

### 5.3 Goals sync (`goals-sync.spec.ts`)
- [ ] 5.3.1 Create goal → push → pull → verify goal data
- [ ] 5.3.2 Modify goal (title, status, focus) → push → pull → verify changes
- [ ] 5.3.3 Soft-delete goal → push → pull → verify is_deleted

### 5.4 Categories sync (`categories-sync.spec.ts`)
- [ ] 5.4.1 Create category → push → pull → verify
- [ ] 5.4.2 Modify category → push → pull → verify
- [ ] 5.4.3 Soft-delete category → push → pull → verify

### 5.5 Contexts sync (`contexts-sync.spec.ts`)
- [ ] 5.5.1 Create context → push → pull → verify
- [ ] 5.5.2 Modify context → push → pull → verify
- [ ] 5.5.3 Soft-delete context → push → pull → verify

### 5.6 Ideas sync (`ideas-sync.spec.ts`)
- [ ] 5.6.1 Create idea → push → pull → verify
- [ ] 5.6.2 Modify idea → push → pull → verify
- [ ] 5.6.3 Soft-delete idea → push → pull → verify

### 5.7 Checklists sync (`checklists-sync.spec.ts`)
- [ ] 5.7.1 Create checklist item → push → pull → verify
- [ ] 5.7.2 Modify checklist item (toggle, reorder) → push → pull → verify
- [ ] 5.7.3 Soft-delete checklist item → push → pull → verify

### 5.8 Settings sync (`settings-sync.spec.ts`)
- [ ] 5.8.1 Change setting value → push → pull → verify persisted

### 5.9 Covers (`covers-sync.spec.ts`)
- [ ] 5.9.1 Upload cover for a goal → verify stored in Supabase Storage
- [ ] 5.9.2 Retrieve cover URL → verify image accessible
- [ ] 5.9.3 Delete cover → verify removed from storage

### 5.10 Multi-entity flow (`full-flow.spec.ts`)
- [ ] 5.10.1 Create task + goal + category → push all → pull all → verify consistency
- [ ] 5.10.2 Modify multiple entities → push → pull → verify all changes applied
- [ ] 5.10.3 Soft-delete across entity types → push → pull → verify all deletions

### 5.11 Multi-device sync (`multi-device-sync.spec.ts`)

Two browser contexts (App A and App B) connected to the same Supabase backend under the same user.

- [ ] 5.11.1 App A creates task → pushes → App B pulls → task appears in App B
- [ ] 5.11.2 App A modifies task title → pushes → App B pulls → sees updated title
- [ ] 5.11.3 App A soft-deletes task → pushes → App B pulls → task marked deleted in App B
- [ ] 5.11.4 App A creates goal + category → pushes → App B pulls → both appear in App B
- [ ] 5.11.5 App A uploads cover → App B pulls → cover is accessible in App B

### 5.12 Conflict resolution between devices (`multi-device-conflicts.spec.ts`)

Both apps edit the same entity offline, then sync.

- [ ] 5.12.1 Both modify same task (different titles) → App A pushes first → App B pushes → App B gets conflict, overwrites with server version (last-write-wins by updated_at)
- [ ] 5.12.2 App A modifies task with newer updated_at → App B modifies same task with older updated_at → App B pushes → App B accepted (newer wins); App A pushes → App A gets conflict (server already has newer)
- [ ] 5.12.3 App A deletes task (soft-delete) → App B modifies same task → both push → verify final state is consistent (delete wins if updated_at is newer)
- [ ] 5.12.4 Both modify same goal (different fields) → push both → last-write-wins applies to entire record (not field-level merge)
- [ ] 5.12.5 App A modifies setting → App B modifies same setting → both push → conflict resolved by updated_at timestamp
- [ ] 5.12.6 App A pushes → App B pulls (gets update) → App B modifies → pushes → no conflict (clean sequence)

### 5.13 Recurring task sync between devices (`multi-device-recurring.spec.ts`)

- [ ] 5.13.1 App A creates recurring task (daily) → pushes → App B pulls → recurring task with repeat_rule appears in App B
- [ ] 5.13.2 App A completes recurring task → new occurrence is created (next_date advanced) → push → App B pulls → sees completed task + new occurrence
- [ ] 5.13.3 App A completes recurring task offline, App B completes same recurring task offline → both push → conflict on original task resolved by updated_at; both may have created new occurrences with same next_date → verify deduplication or consistent state
- [ ] 5.13.4 App A completes recurring task → push → App B pulls → App B sees new occurrence (does NOT create a duplicate occurrence locally)
- [ ] 5.13.5 Recurring task with `after_completion` type: App A completes → new date = completed_at + delay_days → push → App B pulls → verify correct next_date
- [ ] 5.13.6 Recurring task with skipped dates (next_date in the past): App A opens after long inactivity → skip logic advances to nearest future date → push → App B pulls → verify skipped-to date, not all intermediate dates

### 5.14 Pull protects dirty records (`multi-device-dirty-protection.spec.ts`)

- [ ] 5.14.1 App B has local unsaved changes (needsSync=true) → App A pushes update to same record → App B pulls → local dirty record is NOT overwritten
- [ ] 5.14.2 App B has local unsaved changes → App B pushes → then pulls → dirty record now synced, next pull can overwrite
- [ ] 5.14.3 App B creates new task (not yet pushed) → App A pushes different new task → App B pulls → gets App A's task without losing its own unpushed task

## 6. Verification

- [ ] 6.1 Run full test suite: `pnpm --filter integration test` — verify pass with Docker running
- [ ] 6.2 Verify clean teardown: no orphaned containers after test run
- [ ] 6.3 Verify idempotency: run tests twice in a row without manual cleanup
