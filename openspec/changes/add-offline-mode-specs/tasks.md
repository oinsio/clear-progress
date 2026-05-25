## 1. BDD Feature Files

- [ ] 1.1 Create `connection_status.feature` — connection status derivation scenarios (FR4, 8 scenarios covering all states and priority rules)
- [ ] 1.2 Create `offline_data_access.feature` — offline CRUD and dirty flag guarantees (FR1-FR3, FR7-FR8, 5 scenarios)

## 2. BDD Step Definitions

- [ ] 2.1 Implement `connection_status.steps.ts` — step definitions with mocked useAuth, useSync, useConnectionConfig (same pattern as existing `useConnectionStatus.test.ts`)
- [ ] 2.2 Implement `offline_data_access.steps.ts` — step definitions with real TaskRepository + fake-indexeddb, verify CRUD works without network

## 3. Verification

- [ ] 3.1 Run `pnpm test` — all BDD scenarios pass (green)
- [ ] 3.2 Run `pnpm run build` — build succeeds
