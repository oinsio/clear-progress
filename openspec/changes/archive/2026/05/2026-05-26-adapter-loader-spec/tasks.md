## 1. OpenSpec Stable Spec

- [x] 1.1 Create `openspec/specs/adapter-loader/spec.md` — adapter loading capability (config-based type dispatch, GAS/Supabase factory invocation, lazy caching, IIFE fallback, error handling) — implements FR1, FR2, FR3, FR4, FR5, FR6

## 2. BDD Feature Files — Adapter Creation

- [x] 2.1 Create `features/adapter_loader/adapter_creation.feature` — scenarios for GAS adapter creation, Supabase adapter creation, error on missing config — @adapter-loader-spec @FR1 @FR2 @FR5 @FR6 @FR7

## 3. BDD Step Definitions — Adapter Creation

- [x] 3.1 Create `features/adapter_loader/steps/adapter_creation.steps.ts` — step definitions using vi.mock for adapter factories and connectionService

## 4. BDD Feature Files — Adapter Caching

- [x] 4.1 Create `features/adapter_loader/adapter_caching.feature` — scenarios for lazy singleton caching, IIFE null fallback, IIFE with config — @adapter-loader-spec @FR3 @FR4 @FR8

## 5. BDD Step Definitions — Adapter Caching

- [x] 5.1 Create `features/adapter_loader/steps/adapter_caching.steps.ts` — step definitions for caching and IIFE behavior

## 6. Verification

- [x] 6.1 Run all BDD tests and verify they pass
- [x] 6.2 Verify build: `pnpm run build`
