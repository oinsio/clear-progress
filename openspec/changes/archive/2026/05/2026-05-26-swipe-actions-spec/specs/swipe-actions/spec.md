# Swipe Actions

Touch gesture hooks for mobile interactions. `useSwipeAction` provides right-swipe-to-complete with threshold detection and visual feedback. `useLongPress` distinguishes long press from tap with timer-based activation and move cancellation.

## ADDED Requirements

### Requirement: Swipe action initial state

useSwipeAction SHALL return translateX=0 and isThresholdReached=false as initial state before any touch interaction. Implements FR1 of swipe-actions-spec.

#### Scenario: Initial translateX is zero

- **WHEN** useSwipeAction is rendered with an enabled ref
- **THEN** translateX is 0

#### Scenario: Initial isThresholdReached is false

- **WHEN** useSwipeAction is rendered with an enabled ref
- **THEN** isThresholdReached is false

### Requirement: Swipe action disabled guard

useSwipeAction SHALL ignore all touch events when isEnabled is false. No state changes occur and onAction is never called. Implements FR2 of swipe-actions-spec.

#### Scenario: Disabled hook ignores swipe

- **WHEN** isEnabled is false and user swipes right past threshold
- **THEN** translateX remains 0 and onAction is not called

### Requirement: Right swipe tracking

useSwipeAction SHALL update translateX during right swipe once horizontal drag is detected (deltaX > 5px). Implements FR3 of swipe-actions-spec.

#### Scenario: TranslateX updates during right swipe

- **WHEN** user swipes right by 40px
- **THEN** translateX equals 40

### Requirement: Threshold detection

useSwipeAction SHALL set isThresholdReached=true when translateX reaches the threshold (window.innerWidth * 0.4). Implements FR4 of swipe-actions-spec.

#### Scenario: Threshold reached on sufficient swipe

- **WHEN** user swipes right to exactly the threshold distance
- **THEN** isThresholdReached is true

#### Scenario: Threshold not reached on insufficient swipe

- **WHEN** user swipes right to threshold minus 1 pixel
- **THEN** isThresholdReached is false

### Requirement: Action callback on threshold release

useSwipeAction SHALL call onAction callback on touchend when translateX >= threshold. Implements FR5 of swipe-actions-spec.

#### Scenario: Action fires on release past threshold

- **WHEN** user swipes right past threshold and releases
- **THEN** onAction is called once

#### Scenario: Action does not fire on release below threshold

- **WHEN** user swipes right below threshold and releases
- **THEN** onAction is not called

### Requirement: State reset on touchend

useSwipeAction SHALL reset translateX to 0 and isThresholdReached to false on touchend regardless of whether threshold was reached. Implements FR6 of swipe-actions-spec.

#### Scenario: State resets after release

- **WHEN** user swipes right past threshold and releases
- **THEN** translateX is 0 and isThresholdReached is false

### Requirement: Left swipe cancellation

useSwipeAction SHALL cancel swipe when deltaX < 0 (left swipe direction). No translateX update occurs. Implements FR7 of swipe-actions-spec.

#### Scenario: Left swipe is ignored

- **WHEN** user swipes left
- **THEN** translateX remains 0 and onAction is not called on release

### Requirement: Vertical movement cancellation

useSwipeAction SHALL cancel swipe when vertical movement dominates (absY > absX and absY > 10px) to avoid interfering with scrolling. Implements FR8 of swipe-actions-spec.

#### Scenario: Vertical scroll cancels swipe

- **WHEN** user moves finger predominantly vertically (absY > absX, absY > 10px)
- **THEN** translateX resets to 0

### Requirement: Rubber-band clamping

useSwipeAction SHALL clamp translateX at 1.5x threshold to prevent excessive visual displacement. Implements FR9 of swipe-actions-spec.

#### Scenario: TranslateX clamped at 1.5x threshold

- **WHEN** user swipes right to 3x threshold distance
- **THEN** translateX equals 1.5x threshold

### Requirement: Data-no-swipe exclusion

useSwipeAction SHALL not start swipe when touch target has the data-no-swipe attribute or is a descendant of such element. Implements FR10 of swipe-actions-spec.

#### Scenario: Touch on data-no-swipe element is ignored

- **WHEN** touch starts on an element with data-no-swipe attribute
- **THEN** translateX remains 0 during subsequent touch move

### Requirement: Threshold recalculation on resize

useSwipeAction SHALL recalculate threshold when window is resized. Implements FR11 of swipe-actions-spec.

#### Scenario: Threshold updates after window resize

- **WHEN** window is resized to a new width
- **THEN** the new threshold equals new width * 0.4

### Requirement: Event listener cleanup

useSwipeAction SHALL remove all touch event listeners on unmount. Implements FR12 of swipe-actions-spec.

#### Scenario: Listeners removed on unmount

- **WHEN** the hook unmounts
- **THEN** touchstart, touchmove, and touchend listeners are removed from the element

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
