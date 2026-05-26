# Tasks — task-detail-panel-spec

## 1. Stable specification

- [x] 1.1 Create `openspec/specs/task-detail-panel/spec.md` covering FR1-FR12

## 2. BDD Unit tests for resolveEntityName

- [x] 2.1 Create feature file `packages/client/src/test/features/task_detail_panel/task_detail_panel_entity_name.feature` (@task-detail-panel-spec @FR10-FR12)
- [x] 2.2 Create step definitions `packages/client/src/test/features/task_detail_panel/steps/task_detail_panel_entity_name.steps.ts`

## 3. BDD Unit tests for useTaskFormState

- [x] 3.1 Create feature file `packages/client/src/test/features/task_detail_panel/task_detail_panel_form_state.feature` (@task-detail-panel-spec @FR1-FR3)
- [x] 3.2 Create step definitions `packages/client/src/test/features/task_detail_panel/steps/task_detail_panel_form_state.steps.ts`

## 4. BDD Unit tests for useTaskEditLabels

- [x] 4.1 Create feature file `packages/client/src/test/features/task_detail_panel/task_detail_panel_labels.feature` (@task-detail-panel-spec @FR4-FR9)
- [x] 4.2 Create step definitions `packages/client/src/test/features/task_detail_panel/steps/task_detail_panel_labels.steps.ts`

## 5. Verification

- [x] 5.1 Run BDD tests — verify all GREEN
- [x] 5.2 Run `pnpm run build` — verify build passes
