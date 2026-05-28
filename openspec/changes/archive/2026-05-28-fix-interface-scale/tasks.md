## 1. CSS Fix

- [x] 1.1 Replace `zoom` with `font-size` percentage on `html[data-scale]` selectors in `packages/client/src/styles/globals.css` (FR1, FR2, FR3, FR4)
- [x] 1.2 Remove `font-size: calc(1rem * var(--scale-factor))` from `body` in `globals.css` (FR5)

## 2. E2E Test Update

- [x] 2.1 Update `packages/client/src/test/e2e/interface-scale.spec.ts` — fix "should visually change body font-size based on scale" test to check `html` font-size instead of `body` (FR1-FR4)

## 3. Verification

- [x] 3.1 Run `pnpm run build` — verify no build errors
- [x] 3.2 Run BDD unit tests for theme — verify no regressions
