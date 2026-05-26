# Swipe Actions Specs

## Why

Swipe gesture interactions (`useSwipeAction`) and long-press interactions (`useLongPress`) are implemented across mobile task views, but the behavior lacks a formal specification and BDD tests. The `useSwipeAction` hook manages a touch-based state machine for right-swipe-to-complete with threshold detection, left-swipe cancellation, vertical drift guard, data-no-swipe exclusion, and rubber-band clamping. The `useLongPress` hook manages a timer-based state machine for distinguishing long press from click, with move cancellation. Without specs, these contracts are undocumented.

## What Changes

- ADDED: Specification for swipe action hook (useSwipeAction) — threshold detection, direction filtering, state reset, clamping, disabled guard, data-no-swipe guard
- ADDED: Specification for long press hook (useLongPress) — timer-based activation, move cancellation, click fallback, touch cancel handling, custom thresholds
- ADDED: BDD unit tests for useSwipeAction behavior
- ADDED: BDD unit tests for useLongPress behavior

## Goals

- G1: Document swipe action and long press behavior in executable specifications
- G2: Cover useSwipeAction and useLongPress hook logic with BDD unit tests

## Non-Goals

- NG1: Do not modify existing implementation code
- NG2: Do not add E2E tests for touch interactions (requires real touch hardware or complex simulation)
- NG3: Do not test React rendering of TaskItem that uses these hooks — only test hooks in isolation
- NG4: Do not re-test task completion/uncomplete service logic (already covered in tasks_completion)

## Users & Scenarios

- U1: User swipes right on a task past 40% of screen width — action callback fires on touch end
- U2: User swipes right but releases before threshold — no action, state resets
- U3: User swipes left — swipe is cancelled, no state change
- U4: User starts vertical scroll — swipe is cancelled to avoid interfering with scrolling
- U5: User swipes on a data-no-swipe element (e.g., checkbox) — swipe does not start
- U6: User long-presses a task — onLongPress fires after 500ms
- U7: User taps quickly — onClick fires instead of onLongPress
- U8: User moves finger during long press — long press timer is cancelled

## Requirements

### Functional

- FR1: useSwipeAction SHALL return translateX=0 and isThresholdReached=false as initial state
- FR2: useSwipeAction SHALL ignore all touch events when isEnabled is false
- FR3: useSwipeAction SHALL update translateX during right swipe (deltaX > 0) once horizontal drag is detected (deltaX > 5px)
- FR4: useSwipeAction SHALL set isThresholdReached=true when translateX reaches the threshold (window.innerWidth * 0.4)
- FR5: useSwipeAction SHALL call onAction callback on touchend when translateX >= threshold
- FR6: useSwipeAction SHALL reset translateX and isThresholdReached on touchend regardless of threshold
- FR7: useSwipeAction SHALL cancel swipe when deltaX < 0 (left swipe)
- FR8: useSwipeAction SHALL cancel swipe when vertical movement dominates (absY > absX and absY > 10px)
- FR9: useSwipeAction SHALL clamp translateX at 1.5x threshold (rubber-band effect)
- FR10: useSwipeAction SHALL not start swipe when touch target has data-no-swipe attribute
- FR11: useSwipeAction SHALL recalculate threshold on window resize
- FR12: useSwipeAction SHALL remove event listeners on unmount
- FR13: useLongPress SHALL call onLongPress after threshold duration (default 500ms) of sustained touch
- FR14: useLongPress SHALL cancel long press timer when finger moves beyond moveThreshold (default 10px)
- FR15: useLongPress SHALL call onClick on quick tap (touchend before long press fires) when onClick is provided
- FR16: useLongPress SHALL not call onClick after long press has already triggered
- FR17: useLongPress SHALL cancel timer on touchcancel
- FR18: useLongPress SHALL support custom threshold and moveThreshold options
- FR19: useLongPress SHALL call onClick on mouse click event when onClick is provided

## UX Acceptance Criteria

- UX1: Swipe right provides visual feedback via translateX during drag
- UX2: Swipe beyond threshold shows clear visual indication (isThresholdReached)
- UX3: Release after threshold triggers action immediately
- UX4: Long press activates after a deliberate hold, not accidental touch

## Behavior

Reference to feature files:
- `features/swipe_actions/swipe_action_initial_state.feature` (@swipe-actions-spec tags)
- `features/swipe_actions/swipe_action_right_swipe.feature` (@swipe-actions-spec tags)
- `features/swipe_actions/swipe_action_cancellation.feature` (@swipe-actions-spec tags)
- `features/swipe_actions/swipe_action_edge_cases.feature` (@swipe-actions-spec tags)
- `features/swipe_actions/long_press_activation.feature` (@swipe-actions-spec tags)
- `features/swipe_actions/long_press_click.feature` (@swipe-actions-spec tags)
- `features/swipe_actions/long_press_options.feature` (@swipe-actions-spec tags)

## Affected IA

No changes.

## Success Metrics

- M1: Spec covers FR1-FR19 with executable scenarios
- M2: BDD unit tests pass for all scenarios
- M3: All existing tests remain green after adding new specs

## Capabilities

### New Capabilities
- `swipe-actions`: Swipe gesture and long press touch interaction hooks — useSwipeAction state machine and useLongPress timer logic

### Modified Capabilities

None.

## Impact

- New files: `openspec/specs/swipe-actions/spec.md`, BDD features + steps
- Existing code is not modified
