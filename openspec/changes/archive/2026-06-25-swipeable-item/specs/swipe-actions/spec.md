# Swipe Actions — Delta Spec

Changes to the swipe-actions capability for swipeable-item. The useSwipeAction hook is replaced by useSwipeGesture (defined in swipe-gesture spec). Swipe UI logic moves from TaskItem to SwipeableItem. useLongPress requirements are unchanged.

## REMOVED Requirements

### Requirement: Swipe action initial state

**Reason**: Replaced by useSwipeGesture initial state requirement in swipe-gesture spec.
**Migration**: Use useSwipeGesture from `@/hooks/useSwipeGesture` instead of useSwipeAction.

### Requirement: Swipe action disabled guard

**Reason**: Replaced by useSwipeGesture suspension and isEnabled support.
**Migration**: Use SwipeableItem isEnabled prop or useSwipeGesture isSuspended.

### Requirement: Right swipe tracking

**Reason**: Replaced by useSwipeGesture bidirectional swipe support.
**Migration**: Use useSwipeGesture with swipeRight config.

### Requirement: Threshold detection

**Reason**: Replaced by useSwipeGesture distance threshold detection.
**Migration**: Use useSwipeGesture isThresholdReached.

### Requirement: Action callback on threshold release

**Reason**: Replaced by useSwipeGesture distance and velocity threshold release.
**Migration**: Use useSwipeGesture swipeRight.onAction / swipeLeft.onAction.

### Requirement: State reset on touchend

**Reason**: Replaced by useSwipeGesture state reset on pointerup.
**Migration**: Use useSwipeGesture which resets on pointerup.

### Requirement: Left swipe cancellation

**Reason**: No longer applicable. useSwipeGesture supports bidirectional swipe.
**Migration**: Configure only swipeRight to ignore left swipe, or configure both directions.

### Requirement: Vertical movement cancellation

**Reason**: Replaced by useSwipeGesture vertical movement cancellation.
**Migration**: Behavior preserved in useSwipeGesture.

### Requirement: Rubber-band clamping

**Reason**: Replaced by useSwipeGesture rubber-band clamping.
**Migration**: Behavior preserved in useSwipeGesture.

### Requirement: Data-no-swipe exclusion

**Reason**: Replaced by useSwipeGesture data-no-swipe exclusion.
**Migration**: Behavior preserved in useSwipeGesture.

### Requirement: Threshold recalculation on resize

**Reason**: Replaced by useSwipeGesture threshold recalculation.
**Migration**: Behavior preserved in useSwipeGesture.

### Requirement: Event listener cleanup

**Reason**: Replaced by useSwipeGesture event listener cleanup.
**Migration**: Behavior preserved in useSwipeGesture with Pointer Events.

## MODIFIED Requirements

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
