# Swipe Actions

Touch gesture hooks for mobile interactions. `useLongPress` distinguishes long press from tap with timer-based activation and move cancellation. Note: `useSwipeAction` has been replaced by `useSwipeGesture` (see swipe-gesture spec).

## Requirements

### Requirement: Long press activation

useLongPress SHALL call onLongPress after threshold duration (default 500ms) of sustained touch without significant movement. Implements FR13 of swipe-actions-spec.

#### Scenario: Long press fires after threshold

- **WHEN** user holds touch for 500ms without moving
- **THEN** onLongPress is called once

### Requirement: Long press move cancellation

useLongPress SHALL cancel the long press timer when finger moves beyond moveThreshold (default 10px Euclidean distance). Implements FR14 of swipe-actions-spec.

#### Scenario: Movement beyond threshold cancels long press

- **WHEN** user moves finger beyond 10px during hold
- **THEN** onLongPress is not called after threshold duration

#### Scenario: Small movement within threshold preserves long press

- **WHEN** user moves finger less than 10px during hold
- **THEN** onLongPress is still called after threshold duration

### Requirement: Click fallback on quick tap

useLongPress SHALL call onClick on quick tap (touchend before long press fires) when onClick callback is provided. Implements FR15 of swipe-actions-spec.

#### Scenario: Quick tap triggers onClick

- **WHEN** user taps and releases before 500ms
- **THEN** onClick is called and onLongPress is not called

### Requirement: No click after long press

useLongPress SHALL not call onClick after long press has already triggered. Implements FR16 of swipe-actions-spec.

#### Scenario: TouchEnd after long press does not trigger click

- **WHEN** long press has already fired and user releases
- **THEN** onClick is not called

### Requirement: Touch cancel handling

useLongPress SHALL cancel the timer and reset state on touchcancel event. Implements FR17 of swipe-actions-spec.

#### Scenario: Touch cancel stops long press

- **WHEN** touchcancel fires during hold
- **THEN** onLongPress is not called after threshold duration

### Requirement: Custom threshold options

useLongPress SHALL support custom threshold and moveThreshold options overriding defaults. Implements FR18 of swipe-actions-spec.

#### Scenario: Custom time threshold

- **WHEN** threshold is set to 1000ms and user holds for 500ms
- **THEN** onLongPress is not called
- **WHEN** user continues holding until 1000ms total
- **THEN** onLongPress is called

#### Scenario: Custom move threshold

- **WHEN** moveThreshold is set to 20px and user moves 18px
- **THEN** onLongPress is still called after threshold duration

### Requirement: Mouse click passthrough

useLongPress SHALL call onClick on mouse click event when onClick is provided. Implements FR19 of swipe-actions-spec.

#### Scenario: Mouse click triggers onClick

- **WHEN** user clicks with mouse
- **THEN** onClick is called and onLongPress is not called
