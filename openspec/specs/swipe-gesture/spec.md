# Swipe Gesture

Headless hook `useSwipeGesture` for bidirectional swipe detection using Pointer Events. Supports distance and velocity thresholds, suspension for DnD coordination, and rubber-band clamping. Implements FR1-FR12 of swipeable-item.

## Requirements

### Requirement: Swipe gesture initial state

useSwipeGesture SHALL return translateX=0, isThresholdReached=false, direction=null, isSwiping=false, and activeAction=null as initial state before any pointer interaction. Implements FR1 of swipeable-item.

#### Scenario: Initial state values

- **WHEN** useSwipeGesture is rendered with an enabled ref
- **THEN** translateX is 0, isThresholdReached is false, direction is null, isSwiping is false, activeAction is null

### Requirement: Pointer Events usage

useSwipeGesture SHALL use Pointer Events (pointerdown, pointermove, pointerup) instead of Touch Events. Implements FR1 of swipeable-item.

#### Scenario: Hook attaches pointer event listeners

- **WHEN** useSwipeGesture mounts with a valid ref
- **THEN** pointerdown listener is attached to the element

#### Scenario: Hook listens to pointermove on document

- **WHEN** pointerdown fires on the element
- **THEN** pointermove and pointerup listeners are attached to document

### Requirement: Bidirectional swipe support

useSwipeGesture SHALL support both right and left swipe independently. Each direction is configured via optional `swipeRight` and `swipeLeft` props. If a direction has no config, swipe in that direction is ignored. Implements FR2 of swipeable-item.

#### Scenario: Right swipe tracked when swipeRight configured

- **WHEN** swipeRight is configured and user swipes right by 40px
- **THEN** translateX equals 40 and direction is "right"

#### Scenario: Left swipe tracked when swipeLeft configured

- **WHEN** swipeLeft is configured and user swipes left by 40px
- **THEN** translateX equals -40 and direction is "left"

#### Scenario: Right swipe ignored when only swipeLeft configured

- **WHEN** only swipeLeft is configured and user swipes right
- **THEN** translateX remains 0

#### Scenario: Left swipe ignored when only swipeRight configured

- **WHEN** only swipeRight is configured and user swipes left
- **THEN** translateX remains 0

### Requirement: Distance threshold detection

useSwipeGesture SHALL set isThresholdReached=true when |translateX| reaches the threshold (window.innerWidth * SWIPE_COMPLETE_THRESHOLD_PERCENT). Implements FR3 of swipeable-item.

#### Scenario: Threshold reached on sufficient right swipe

- **WHEN** user swipes right to exactly the threshold distance
- **THEN** isThresholdReached is true

#### Scenario: Threshold not reached on insufficient swipe

- **WHEN** user swipes right to threshold minus 1 pixel
- **THEN** isThresholdReached is false

#### Scenario: Threshold reached on sufficient left swipe

- **WHEN** user swipes left to exactly the threshold distance
- **THEN** isThresholdReached is true

### Requirement: Action callback on distance threshold release

useSwipeGesture SHALL call the active direction's onAction callback on pointerup when |translateX| >= distance threshold. Implements FR3 of swipeable-item.

#### Scenario: Right action fires on release past threshold

- **WHEN** user swipes right past threshold and releases
- **THEN** swipeRight.onAction is called once

#### Scenario: Left action fires on release past threshold

- **WHEN** user swipes left past threshold and releases
- **THEN** swipeLeft.onAction is called once

#### Scenario: Action does not fire on release below threshold

- **WHEN** user swipes right below threshold and releases with low velocity
- **THEN** onAction is not called

### Requirement: Velocity-based triggering

useSwipeGesture SHALL call onAction on pointerup when swipe velocity exceeds SWIPE_VELOCITY_THRESHOLD_PX_PER_MS, regardless of distance traveled. Velocity is computed from the last two pointermove events. Implements FR4 of swipeable-item.

#### Scenario: Fast short swipe triggers action

- **WHEN** user swipes right with velocity above threshold but below distance threshold
- **THEN** swipeRight.onAction is called

#### Scenario: Slow swipe below distance does not trigger

- **WHEN** user swipes right with velocity below threshold and below distance threshold
- **THEN** onAction is not called

### Requirement: Suspension support

useSwipeGesture SHALL ignore all pointer events when isSuspended is true. Active swipe SHALL be cancelled immediately when isSuspended becomes true. Implements FR5 of swipeable-item.

#### Scenario: Suspended hook ignores pointer events

- **WHEN** isSuspended is true and user swipes right past threshold
- **THEN** translateX remains 0 and onAction is not called

#### Scenario: Active swipe cancelled on suspension

- **WHEN** user is mid-swipe and isSuspended becomes true
- **THEN** translateX resets to 0 and isSwiping becomes false

### Requirement: Export isSwiping state

useSwipeGesture SHALL set isSwiping=true when horizontal drag is detected (|deltaX| > 5px) and set it back to false on pointerup or cancellation. Implements FR6 of swipeable-item.

#### Scenario: isSwiping becomes true during drag

- **WHEN** user drags horizontally beyond 5px
- **THEN** isSwiping is true

#### Scenario: isSwiping resets on release

- **WHEN** user releases after swiping
- **THEN** isSwiping is false

### Requirement: Rubber-band clamping

useSwipeGesture SHALL clamp |translateX| at 1.5x threshold to prevent excessive displacement. Implements FR7 of swipeable-item.

#### Scenario: TranslateX clamped at 1.5x threshold for right swipe

- **WHEN** user swipes right to 3x threshold distance
- **THEN** translateX equals 1.5x threshold

#### Scenario: TranslateX clamped at -1.5x threshold for left swipe

- **WHEN** user swipes left to 3x threshold distance
- **THEN** translateX equals -1.5x threshold

### Requirement: Vertical movement cancellation

useSwipeGesture SHALL cancel swipe when vertical movement dominates (absY > absX and absY > 10px). Implements FR8 of swipeable-item.

#### Scenario: Vertical scroll cancels swipe

- **WHEN** user moves finger predominantly vertically (absY > absX, absY > 10px)
- **THEN** translateX resets to 0 and isSwiping is false

### Requirement: Data-no-swipe exclusion

useSwipeGesture SHALL not start swipe when pointer target has the data-no-swipe attribute or is a descendant of such element. Implements FR9 of swipeable-item.

#### Scenario: Pointer on data-no-swipe element is ignored

- **WHEN** pointerdown starts on an element with data-no-swipe attribute
- **THEN** translateX remains 0 during subsequent pointer move

### Requirement: Threshold recalculation on resize

useSwipeGesture SHALL recalculate the distance threshold when window is resized. Implements FR10 of swipeable-item.

#### Scenario: Threshold updates after window resize

- **WHEN** window is resized to a new width
- **THEN** the new threshold equals new width * SWIPE_COMPLETE_THRESHOLD_PERCENT

### Requirement: State reset on pointerup

useSwipeGesture SHALL reset translateX to 0, isThresholdReached to false, direction to null, and isSwiping to false on pointerup regardless of whether threshold was reached. Implements FR11 of swipeable-item.

#### Scenario: State resets after release

- **WHEN** user swipes right past threshold and releases
- **THEN** translateX is 0, isThresholdReached is false, direction is null, isSwiping is false

### Requirement: Event listener cleanup

useSwipeGesture SHALL remove all pointer event listeners on unmount. Implements FR12 of swipeable-item.

#### Scenario: Listeners removed on unmount

- **WHEN** the hook unmounts
- **THEN** pointerdown listener is removed from the element and pointermove/pointerup from document

### Requirement: Active action tracking

useSwipeGesture SHALL set activeAction to the SwipeActionConfig corresponding to the current swipe direction. Implements FR2 of swipeable-item.

#### Scenario: activeAction matches right config during right swipe

- **WHEN** user swipes right with swipeRight configured
- **THEN** activeAction equals the swipeRight config

#### Scenario: activeAction is null when no config for direction

- **WHEN** user swipes right without swipeRight configured
- **THEN** activeAction is null
