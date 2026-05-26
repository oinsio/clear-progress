# Design: Adapter Loader Spec

## Context

Adapter loading is implemented in `packages/client/src/services/defaultServices.ts` as the `createSyncAdapter()` function. The original `packages/adapter-loader` package was deprecated per D3 of add-supabase-ui — the generic registry pattern could not type-safely accommodate different constructor signatures per backend type. The current implementation uses a direct switch on `config.type` with per-type factory functions:

- `config.type === "gas"` -> `createGasAdapter(config.url, getAccessToken)`
- `config.type === "supabase"` -> `createSupabaseAdapter(getSupabaseClient())`

Existing unit tests in `defaultServices.test.ts` cover all branches but lack BDD feature files. This change adds formal specs and BDD tests for the adapter creation logic (FR1-FR8 from proposal).

## Goals / Non-Goals

**Goals:**
- Create openspec spec documenting adapter loading behavior as the authoritative reference
- Add BDD feature files and step definitions for adapter creation, caching, and error handling
- Follow established patterns from connection-management-spec and settings-specs-and-bdd BDD tests

**Non-Goals:**
- No refactoring of existing adapter loading code
- No tests for individual adapter implementations (covered by adapter-gas and adapter-supabase specs)
- No resurrection of the deprecated adapter-loader package

## Decisions

### Decision 1: BDD tests use vi.mock for adapter factories and connectionService

The adapter creation function depends on external modules (`@clear-progress/adapter-gas`, `@clear-progress/adapter-supabase`, `connectionService`, `supabaseClientManager`, `tokenManager`). BDD steps will mock these dependencies using `vi.mock()` and `vi.resetModules()` + dynamic `import()` to test each scenario in isolation. This matches the existing pattern in `defaultServices.test.ts`.

Alternative considered: Real adapter instances with fake backends — rejected because adapter creation tests should focus on the dispatch/caching logic, not on adapter internals which have their own specs.

### Decision 2: Two feature files split by concern

Split into `adapter_creation.feature` (type dispatch, error handling, factory arguments) and `adapter_caching.feature` (lazy singleton, IIFE fallback). This keeps each file focused on a single behavior aspect.

Alternative considered: Single feature file — rejected because it would mix two distinct concerns (creation logic vs lifecycle management).

## Risks / Trade-offs

- [Risk] vi.resetModules + dynamic import in BDD steps is verbose — Mitigation: Extract a shared setup helper to reduce boilerplate across scenarios
- [Risk] Specs may drift from implementation — Mitigation: BDD tests serve as executable specs, keeping them in sync
