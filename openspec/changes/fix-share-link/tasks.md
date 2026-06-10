## 1. Update tests (RED)

- [x] 1.1 Update `useShare.test.ts`: mock `import.meta.env.BASE_URL`, expect URL = `origin + BASE_URL` (FR1)
- [x] 1.2 Add test: when `BASE_URL = "/"` the URL is correct, no double slash (FR2)
- [x] 1.3 Run tests — verify new tests FAIL (RED)

## 2. Fix the hook (GREEN)

- [x] 2.1 Replace `window.location.origin` with `window.location.origin + import.meta.env.BASE_URL` in `useShare.ts` (FR1, D1)
- [x] 2.2 Run tests — verify all tests PASS (GREEN)

## 3. Update BDD scenarios

- [x] 3.1 Update BDD feature `app_sharing.feature`: scenario for copying full URL (FR1)
- [x] 3.2 Update step definitions for the new URL expectation

## 4. Verification

- [x] 4.1 Run `pnpm run build` — verify build succeeds
- [x] 4.2 Mutation testing on `useShare.ts` — target >=95% (NFR-P1)
