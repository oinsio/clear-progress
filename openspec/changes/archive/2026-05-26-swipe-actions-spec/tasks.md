# Tasks — swipe-actions-spec

## 1. Stable specification

- [x] 1.1 Create `openspec/specs/swipe-actions/spec.md` covering FR1-FR19

## 2. BDD Unit tests for useSwipeAction

- [x] 2.1 Create feature file `packages/client/src/test/features/swipe_actions/swipe_action_initial_state.feature` (@swipe-actions-spec @FR1, @FR2)
- [x] 2.2 Create step definitions `packages/client/src/test/features/swipe_actions/steps/swipe_action_initial_state.steps.ts`
- [x] 2.3 Create feature file `packages/client/src/test/features/swipe_actions/swipe_action_right_swipe.feature` (@swipe-actions-spec @FR3-FR6)
- [x] 2.4 Create step definitions `packages/client/src/test/features/swipe_actions/steps/swipe_action_right_swipe.steps.ts`
- [x] 2.5 Create feature file `packages/client/src/test/features/swipe_actions/swipe_action_cancellation.feature` (@swipe-actions-spec @FR7, @FR8)
- [x] 2.6 Create step definitions `packages/client/src/test/features/swipe_actions/steps/swipe_action_cancellation.steps.ts`
- [x] 2.7 Create feature file `packages/client/src/test/features/swipe_actions/swipe_action_edge_cases.feature` (@swipe-actions-spec @FR9-FR12)
- [x] 2.8 Create step definitions `packages/client/src/test/features/swipe_actions/steps/swipe_action_edge_cases.steps.ts`

## 3. BDD Unit tests for useLongPress

- [x] 3.1 Create feature file `packages/client/src/test/features/swipe_actions/long_press_activation.feature` (@swipe-actions-spec @FR13, @FR14, @FR17)
- [x] 3.2 Create step definitions `packages/client/src/test/features/swipe_actions/steps/long_press_activation.steps.ts`
- [x] 3.3 Create feature file `packages/client/src/test/features/swipe_actions/long_press_click.feature` (@swipe-actions-spec @FR15, @FR16, @FR19)
- [x] 3.4 Create step definitions `packages/client/src/test/features/swipe_actions/steps/long_press_click.steps.ts`
- [x] 3.5 Create feature file `packages/client/src/test/features/swipe_actions/long_press_options.feature` (@swipe-actions-spec @FR18)
- [x] 3.6 Create step definitions `packages/client/src/test/features/swipe_actions/steps/long_press_options.steps.ts`

## 4. Verification

- [x] 4.1 Run BDD tests — verify all GREEN
- [x] 4.2 Run `pnpm run build` — verify build passes
