# Tasks — app-shell-navigation-spec

## 1. Stable specification

- [x] 1.1 Create `openspec/specs/app-shell-navigation/spec.md` based on delta spec from `specs/app-shell-navigation/spec.md` (FR1-FR10)

## 2. BDD Unit tests for BottomNav

- [x] 2.1 Create feature files in `packages/client/src/test/features/app_shell/`:
  - `app_shell_nav_items.feature` — navigation items rendering and order (@app-shell-navigation-spec @FR1 @FR2 @FR8 @FR9)
  - `app_shell_active_state.feature` — active item highlighting (@app-shell-navigation-spec @FR3)
  - `app_shell_routing.feature` — root redirect, layout nesting (@app-shell-navigation-spec @FR4 @FR5 @FR6)
- [x] 2.2 Create step definitions in `packages/client/src/test/features/app_shell/steps/`:
  - `app_shell_nav_items.steps.tsx`
  - `app_shell_active_state.steps.tsx`
  - `app_shell_routing.steps.ts`
- [x] 2.3 Run BDD tests — verify all GREEN

## 3. Verification

- [x] 3.1 Run `pnpm run build` — verify build passes
- [x] 3.2 Run `npx vitest run` — verify all tests pass
