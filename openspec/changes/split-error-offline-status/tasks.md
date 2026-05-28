## 1. i18n

- [ ] 1.1 Add `sync.serverError` key to `en.json` ("Server error") — FR2
- [ ] 1.2 Add `sync.serverError` key to `ru.json` ("Ошибка сервера") — FR2

## 2. UI Components

- [ ] 2.1 `RightFilterPanel.tsx`: split `hasSyncError` into `isOffline` and `hasServerError`, display different text for `error` and `offline` — FR1, FR2
- [ ] 2.2 `ServerConnectedStatus.tsx`: orange indicator (`bg-orange-500`) for `error`, red (`bg-red-500`) for `offline` — FR3

## 3. Tests

- [ ] 3.1 BDD unit test: when `connectionStatus === "offline"`, "No connection" is displayed — FR1
- [ ] 3.2 BDD unit test: when `connectionStatus === "error"`, "Server error" is displayed — FR2
- [ ] 3.3 BDD unit test: indicator is orange for `error`, red for `offline` — FR3
- [ ] 3.4 Update existing connection_status tests if they check shared text for error/offline

## 4. Verification

- [ ] 4.1 `pnpm run build` — build succeeds
- [ ] 4.2 `npx vitest run` — all tests pass
- [ ] 4.3 Mutation testing on changed files — target >=95%
