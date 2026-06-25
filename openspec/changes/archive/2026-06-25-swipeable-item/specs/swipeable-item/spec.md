# Swipeable Item

UI component `SwipeableItem` that wraps children with configurable swipe actions. Renders swipe background (color + icon) and applies translateX animation to content. Implements FR13, FR14 of swipeable-item.

## ADDED Requirements

### Requirement: SwipeableItem renders children with swipe support

SwipeableItem SHALL render its children inside a container with overflow hidden and relative positioning. The container SHALL apply translateX transform to the content layer based on useSwipeGesture state. Implements FR13 of swipeable-item.

#### Scenario: Children rendered inside swipe container

- **WHEN** SwipeableItem is rendered with children
- **THEN** children are visible inside a container with overflow-hidden

#### Scenario: Content moves during swipe

- **WHEN** user swipes right on SwipeableItem
- **THEN** the content layer translateX matches the swipe distance

### Requirement: Right swipe background

SwipeableItem SHALL render a background layer on the left side with the color and icon from swipeRight config when user swipes right. Background opacity SHALL be 0 at rest, 0.7 during swipe, and 1.0 when threshold is reached. Implements FR13 of swipeable-item.

#### Scenario: Right swipe shows configured background

- **WHEN** user swipes right and swipeRight is configured with color "bg-blue-500" and ArchiveRestore icon
- **THEN** a blue background with ArchiveRestore icon is visible on the left

#### Scenario: Background opacity increases at threshold

- **WHEN** user swipes right past threshold
- **THEN** background opacity is 1.0

#### Scenario: Background hidden at rest

- **WHEN** translateX is 0
- **THEN** background opacity is 0

### Requirement: Left swipe background

SwipeableItem SHALL render a background layer on the right side with the color and icon from swipeLeft config when user swipes left. Implements FR13 of swipeable-item.

#### Scenario: Left swipe shows configured background

- **WHEN** user swipes left and swipeLeft is configured with color "bg-red-500" and Trash2 icon
- **THEN** a red background with Trash2 icon is visible on the right

### Requirement: Snap-back animation

SwipeableItem SHALL apply a CSS transition of SWIPE_SNAP_BACK_DURATION_MS ease-out on the content layer when translateX returns to 0. During active swipe (translateX !== 0 and pointer is down), no transition is applied. Implements FR14 of swipeable-item.

#### Scenario: Snap-back with transition on release

- **WHEN** user releases after swiping and translateX returns to 0
- **THEN** content layer has transition "transform 300ms ease-out"

#### Scenario: No transition during active swipe

- **WHEN** user is actively swiping (translateX > 0)
- **THEN** content layer has transition "none"

### Requirement: SwipeableItem disabled state

SwipeableItem SHALL pass isEnabled prop to useSwipeGesture. When isEnabled is false, no swipe interaction occurs. Implements FR13 of swipeable-item.

#### Scenario: Disabled SwipeableItem ignores swipe

- **WHEN** isEnabled is false and user swipes
- **THEN** translateX remains 0 and no background is shown

### Requirement: SwipeableItem suspension

SwipeableItem SHALL pass isSuspended prop to useSwipeGesture for DnD coordination. Implements FR13 of swipeable-item.

#### Scenario: Suspended SwipeableItem blocks swipe

- **WHEN** isSuspended is true and user swipes
- **THEN** translateX remains 0

### Requirement: Touch-action pan-y for scroll coordination

SwipeableItem container SHALL have CSS `touch-action: pan-y` to let the browser handle vertical scrolling natively while delegating horizontal gestures to JavaScript. This eliminates scroll/swipe ambiguity delay. Implements NFR-P3 of swipeable-item.

#### Scenario: Container has touch-action pan-y

- **WHEN** SwipeableItem is rendered
- **THEN** the container element has style touch-action set to pan-y

### Requirement: Background accessibility

SwipeableItem background layers SHALL have aria-hidden="true" since they are decorative and the action is performed programmatically. Implements NFR-A2 of swipeable-item.

#### Scenario: Background has aria-hidden

- **WHEN** SwipeableItem renders swipe background
- **THEN** the background element has aria-hidden="true"
