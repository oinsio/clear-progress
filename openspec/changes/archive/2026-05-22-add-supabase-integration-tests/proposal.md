# Add Supabase Integration Tests

## Why

Current contract tests for `adapter-supabase` require manual cloud Supabase setup (env vars pointing to a live instance). This makes them fragile, non-reproducible, and impossible to run in CI without credentials. We need autonomous integration tests that spin up a full Supabase stack locally, removing all external dependencies and enabling true E2E verification of the connection and sync flow.

## What Changes

- **ADDED**: New `packages/integration` package with Docker Compose-based Supabase stack
- **ADDED**: Testcontainers lifecycle management (auto start/stop)
- **ADDED**: Playwright integration test covering full UI flow: connect → init → push → pull
- **ADDED**: Mock OAuth server (navikt/mock-oauth2-server + nginx adapter) for real OAuth flow in tests

## Capabilities

### New Capabilities
- `supabase-integration-tests`: Autonomous integration testing of the full Supabase stack (DB, Auth, PostgREST, Edge Functions, Kong gateway) using Docker Compose + Testcontainers + Playwright

### Modified Capabilities
_(none)_

## Impact

- New package `packages/integration` added to monorepo
- `pnpm-workspace.yaml` updated to include the new package
- Depends on Docker being available on the host machine
- Reuses existing migrations and Edge Functions from `packages/adapter-supabase/supabase/`
- No changes to existing packages or production code

## Goals

- G1: 100% test autonomy — no external services, credentials, or cloud dependencies
- G2: Full E2E coverage of Supabase connection and sync flow through real infrastructure

## Non-Goals

- NG1: Replacing existing contract tests (they remain for fast feedback)
- NG2: Testing with real third-party OAuth providers (Google, GitHub) — mock OAuth server is used instead
- NG3: Performance benchmarking of the Supabase stack
- NG4: Running integration tests in CI (future improvement — Docker-in-Docker needed)

## Users & Scenarios

- U1: Developer running integration tests locally before merging Supabase-related changes
- U2: Developer verifying that migrations + Edge Functions work together end-to-end

## Requirements

### Functional

- FR1: Integration test package starts a full Supabase stack via Docker Compose (postgres, auth, rest, edge-runtime, kong)
- FR2: Testcontainers manages container lifecycle (start in globalSetup, stop in globalTeardown)
- FR3: Test authenticates via mock OAuth flow (navikt login form → GoTrue callback → JWT)
- FR4: Playwright test connects to Supabase via UI (enter URL + anon key)
- FR5: Playwright test verifies successful connection (status indicator visible)
- FR6: Playwright test creates, pushes, modifies, and pulls each entity type (tasks, goals, categories, contexts, ideas, checklists, settings)
- FR7: Playwright test verifies cover upload and retrieval flow
- FR8: Playwright test verifies soft-delete sync (mark deleted locally → push → pull on fresh state)
- FR9: Migrations from `adapter-supabase/supabase/migrations/` are applied on DB startup
- FR10: Edge Functions from `adapter-supabase/supabase/functions/` are mounted and running
- FR11: Docker images use `latest` tag to detect upstream breaking changes early
- FR12: Multi-device sync test — two browser contexts share same backend, verify data propagation via push/pull
- FR13: Conflict resolution test — both devices modify same entity offline, then sync; verify last-write-wins by updated_at
- FR14: Recurring task sync between devices — completing recurring task on one device creates new occurrence; other device receives it via pull without duplication
- FR15: Pull protects dirty records — local unsaved changes are not overwritten by incoming server data
- FR16: Mock OAuth server (navikt/mock-oauth2-server) with nginx adapter enables real OAuth flow without external providers

### Non-Functional

#### Performance
- NFR-P1: Container startup timeout up to 120 seconds (cold Docker pulls may take longer on first run)
- NFR-P2: Individual test timeout 60 seconds

## UX Acceptance Criteria

_(N/A — this is a developer-facing test infrastructure change, no end-user UI)_

## Behavior

Integration test spec file: `packages/integration/src/tests/supabase-full-flow.spec.ts`
No Gherkin features — plain Playwright spec for infrastructure-level integration testing.

## Visual Reference

_(N/A — no UI changes)_

## Affected IA

No changes.

## Success Metrics

- M1: `pnpm --filter integration test` passes on a clean machine with Docker running
- M2: Tests cover all entity types: tasks, goals, categories, contexts, ideas, checklists, settings, covers
- M3: Zero external service dependencies (all traffic stays on localhost)

## Open Questions

_(resolved)_
