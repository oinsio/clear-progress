## Context

The DnD feature uses @dnd-kit/core and @dnd-kit/sortable across all entity list pages. The shared `useDndSensors` hook configures platform-specific sensors. Every page follows an identical handleDragEnd pattern: guard for null/same-id, compute indices, arrayMove, delegate to reorder service. FR1-FR3 drive sensor configuration specs, FR4-FR7 drive drag-end handler specs.

## Decisions

### D1: Test useDndSensors as a React hook returning sensor configuration

**Rationale**: useDndSensors wraps dnd-kit's useSensor/useSensors hooks. We cannot test the actual drag activation behavior in a unit test (that requires real pointer events). Instead, we test that the hook returns a valid sensors array with the expected configuration constants. This verifies the configuration contract without testing library internals (NG3).

**Alternative**: Test through E2E with real drag events. Rejected — overly complex for configuration validation, and excluded by NG2.

### D2: Test handleDragEnd as a pure function pattern, not through React rendering

**Rationale**: The handleDragEnd logic is identical across all pages — it is a pure transformation: (items, DragEndEvent) -> reorderedItems or no-op. We extract the testable logic (guard conditions, index computation, arrayMove call) into BDD scenarios that invoke the pattern directly. The underlying reorder service logic is already covered by existing BDD tests (tasks_reorder, checklists_reorder, etc.).

### D3: Sensor constants are tested by value, not by mocking dnd-kit

**Rationale**: The constants DRAG_ACTIVATION_DISTANCE_PX (8), TOUCH_ACTIVATION_DELAY_MS (250), TOUCH_ACTIVATION_TOLERANCE_PX (5) are the contract of useDndSensors. We verify these values are correctly passed to sensor factories. This is the simplest approach that catches regressions if someone changes the constants.

## Risks / Trade-offs

- [Limited test depth] BDD unit tests cannot verify actual drag interaction behavior (mouse movement, touch gestures). Acceptable: that belongs in E2E tests (NG2), and the configuration contract is what matters for unit specs.
- [Duplicate pattern] handleDragEnd logic is duplicated across 6+ components. Acceptable: documenting the pattern in spec serves as a contract; extracting a shared function would be a separate refactoring change.
