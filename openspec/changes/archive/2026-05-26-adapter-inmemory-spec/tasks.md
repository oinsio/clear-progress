## 1. OpenSpec Stable Spec

- [x] 1.1 Create `openspec/specs/adapter-inmemory/spec.md` — in-memory adapter capability (lifecycle, push with validation/conflict, pull with revision filtering, settings CRUD, cover management with dedup/ref-counting, purge) — implements FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11

## 2. BDD Feature Files — Lifecycle

- [x] 2.1 Create `features/adapter_inmemory/adapter_inmemory_lifecycle.feature` — scenarios for ping status, init ok, init idempotent — @adapter-inmemory-spec @FR1

## 3. BDD Step Definitions — Lifecycle

- [x] 3.1 Create `features/adapter_inmemory/steps/adapter_inmemory_lifecycle.steps.ts` — step definitions using direct InMemorySyncAdapter instantiation

## 4. BDD Feature Files — Push

- [x] 4.1 Create `features/adapter_inmemory/adapter_inmemory_push.feature` — scenarios for entity creation, update accepted, validation (UUID, name, box), conflict detection — @adapter-inmemory-spec @FR2 @FR4 @FR5

## 5. BDD Step Definitions — Push

- [x] 5.1 Create `features/adapter_inmemory/steps/adapter_inmemory_push.steps.ts` — step definitions for push operations

## 6. BDD Feature Files — Pull

- [x] 6.1 Create `features/adapter_inmemory/adapter_inmemory_pull.feature` — scenarios for since_revision filtering, empty state, current_revision tracking — @adapter-inmemory-spec @FR3

## 7. BDD Step Definitions — Pull

- [x] 7.1 Create `features/adapter_inmemory/steps/adapter_inmemory_pull.steps.ts` — step definitions for pull operations

## 8. BDD Feature Files — Settings

- [x] 8.1 Create `features/adapter_inmemory/adapter_inmemory_settings.feature` — scenarios for settings create, conflict, pull filtering by settings_updated_at — @adapter-inmemory-spec @FR6

## 9. BDD Step Definitions — Settings

- [x] 9.1 Create `features/adapter_inmemory/steps/adapter_inmemory_settings.steps.ts` — step definitions for settings operations

## 10. BDD Feature Files — Covers

- [x] 10.1 Create `features/adapter_inmemory/adapter_inmemory_covers.feature` — scenarios for upload, dedup, batch, get, delete with ref-counting — @adapter-inmemory-spec @FR7 @FR8 @FR9 @FR10

## 11. BDD Step Definitions — Covers

- [x] 11.1 Create `features/adapter_inmemory/steps/adapter_inmemory_covers.steps.ts` — step definitions for cover operations

## 12. BDD Feature Files — Purge

- [x] 12.1 Create `features/adapter_inmemory/adapter_inmemory_purge.feature` — scenarios for soft-delete removal, purge_revision increment, all entity types — @adapter-inmemory-spec @FR11

## 13. BDD Step Definitions — Purge

- [x] 13.1 Create `features/adapter_inmemory/steps/adapter_inmemory_purge.steps.ts` — step definitions for purge operations

## 14. Verification

- [x] 14.1 Run all BDD tests and verify they pass
- [x] 14.2 Verify build: `pnpm run build`
