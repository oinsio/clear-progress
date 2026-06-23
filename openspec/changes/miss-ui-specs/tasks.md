## 1. ErrorFallback BDD unit tests

- [ ] 1.1 Create BDD feature file `error_fallback/error_fallback_display.feature` with scenarios for localized content, reload action, and centered layout (FR1, FR2, UX1)
- [ ] 1.2 Create step definitions `error_fallback/error_fallback_display.steps.tsx` — render ErrorFallback with i18n, assert content and reload behavior
- [ ] 1.3 Create BDD feature file `error_fallback/route_error_fallback.feature` with scenario for error logging and ErrorFallback rendering (FR3)
- [ ] 1.4 Create step definitions `error_fallback/route_error_fallback.steps.tsx` — render RouteErrorFallback with mocked useRouteError, assert console.error and fallback UI

## 2. GoalCoverPicker BDD unit tests

- [ ] 2.1 Create BDD feature file `goal_cover_picker/goal_cover_picker_display.feature` with scenarios for default/preview states and remove button visibility (FR4, FR7)
- [ ] 2.2 Create step definitions `goal_cover_picker/goal_cover_picker_display.steps.tsx` — render GoalCoverPicker with null/provided previewSrc, assert images and remove button
- [ ] 2.3 Create BDD feature file `goal_cover_picker/goal_cover_picker_interaction.feature` with scenarios for file selection, input reset, and remove action (FR5, FR6, FR8)
- [ ] 2.4 Create step definitions `goal_cover_picker/goal_cover_picker_interaction.steps.tsx` — test file picker trigger, onFileSelect callback, input reset, onRemove callback
- [ ] 2.5 Create BDD feature file `goal_cover_picker/goal_cover_picker_a11y.feature` with scenario for accessibility attributes (NFR-A2)
- [ ] 2.6 Create step definitions `goal_cover_picker/goal_cover_picker_a11y.steps.tsx` — assert aria-label on buttons, aria-hidden on decorative elements

## 3. Verification

- [ ] 3.1 Run all BDD unit tests and verify they pass
- [ ] 3.2 Run mutation testing on ErrorFallback.tsx and GoalCoverPicker.tsx — target >=90%
