## 1. TokenPersistence interface and implementations

- [x] 1.1 Define `TokenPersistence` interface with `save(token, expiresAt)`, `load()`, `clear()` methods — FR1
- [x] 1.2 Implement `noopPersistence` (all methods no-op / return null) — FR3
- [x] 1.3 Implement `localStoragePersistence` using `STORAGE_KEYS.ACCESS_TOKEN` and `ACCESS_TOKEN_EXPIRES_AT` — FR2
- [x] 1.4 Write unit tests for `localStoragePersistence` (save/load/clear, expired token not loaded) — FR2
- [x] 1.5 Write unit tests for `noopPersistence` (save is no-op, load returns null) — FR3

## 2. Refactor tokenManager to use TokenPersistence

- [x] 2.1 Add `configureTokenPersistence(strategy)` that sets active strategy and calls `load()` to restore token — FR4
- [x] 2.2 Remove module-level localStorage restore code (lines 14-29) — FR6
- [x] 2.3 Replace direct localStorage calls in `setAccessToken()` with `persistence.save()` / `persistence.clear()` — FR5
- [x] 2.4 Default persistence is `noopPersistence` (before configure is called) — FR6
- [x] 2.5 Export `TokenPersistence`, `localStoragePersistence`, `noopPersistence`, `configureTokenPersistence`
- [x] 2.6 Update existing tokenManager tests: add `configureTokenPersistence(localStoragePersistence)` in beforeEach for localStorage tests — M1
- [x] 2.7 Add tests: default (noop) — `setAccessToken` does NOT write to localStorage — M3
- [x] 2.8 Add tests: `configureTokenPersistence` calls `load()` and restores token — FR4

## 3. Update AuthProvider

- [x] 3.1 Call `configureTokenPersistence(localStoragePersistence)` for GAS backend in `useState` initializer — FR7
- [x] 3.2 Simplify `accessToken` state initializer to `getAccessToken()` (remove duplicated localStorage logic) — D4
- [x] 3.3 Update AuthProvider tests to work with new initialization flow — M2

## 4. Verification

- [x] 4.1 Run full test suite: `npx vitest run` — all green — M1, M2
- [x] 4.2 Run build: `pnpm run build` — no errors
- [x] 4.3 Ask user to run mutation testing on tokenManager — M4
