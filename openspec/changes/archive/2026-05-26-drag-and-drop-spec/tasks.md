# Tasks — drag-and-drop-spec

## 1. Stable specification

- [x] 1.1 Create `openspec/specs/drag-and-drop/spec.md` covering FR1-FR7

## 2. BDD Unit tests for useDndSensors

- [x] 2.1 Create feature file `packages/client/src/test/features/drag_and_drop/drag_and_drop_sensors.feature` (@drag-and-drop-spec @FR1-FR3)
- [x] 2.2 Create step definitions `packages/client/src/test/features/drag_and_drop/steps/drag_and_drop_sensors.steps.ts`

## 3. BDD Unit tests for handleDragEnd pattern

- [x] 3.1 Create feature file `packages/client/src/test/features/drag_and_drop/drag_and_drop_handler.feature` (@drag-and-drop-spec @FR4-FR7)
- [x] 3.2 Create step definitions `packages/client/src/test/features/drag_and_drop/steps/drag_and_drop_handler.steps.ts`

## 4. Verification

- [x] 4.1 Run BDD tests — verify all GREEN
- [x] 4.2 Run `pnpm run build` — verify build passes
