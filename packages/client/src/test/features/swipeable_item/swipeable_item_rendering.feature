Feature: SwipeableItem rendering
  Implements FR13, FR14, NFR-A2, NFR-P3 of swipeable-item.

  @swipeable-item @FR13
  Scenario: Children rendered inside swipe container
    When SwipeableItem is rendered with children
    Then children are visible inside a container with overflow-hidden

  @swipeable-item @FR13
  Scenario: Content moves during swipe
    Given useSwipeGesture returns translateX of 100
    When SwipeableItem is rendered with swipeRight configured
    Then the content layer translateX matches the swipe distance

  @swipeable-item @FR13
  Scenario: Right swipe shows configured background
    Given useSwipeGesture returns a right swipe in progress
    When SwipeableItem is rendered with swipeRight configured
    Then a background with the configured color is visible on the left
    And the background contains the configured icon

  @swipeable-item @FR13
  Scenario: Left swipe shows configured background
    Given useSwipeGesture returns a left swipe in progress
    When SwipeableItem is rendered with swipeLeft configured
    Then a background with the configured color is visible on the right
    And the background contains the configured icon

  @swipeable-item @FR13
  Scenario: Background hidden at rest
    Given useSwipeGesture returns translateX of 0
    When SwipeableItem is rendered with swipeRight configured
    Then background opacity is 0

  @swipeable-item @FR13
  Scenario: Background opacity during swipe before threshold
    Given useSwipeGesture returns a swipe before threshold
    When SwipeableItem is rendered with swipeRight configured
    Then background opacity is 0.7

  @swipeable-item @FR13
  Scenario: Background opacity at threshold
    Given useSwipeGesture returns a swipe at threshold
    When SwipeableItem is rendered with swipeRight configured
    Then background opacity is 1.0

  @swipeable-item @FR14
  Scenario: No transition during active swipe
    Given useSwipeGesture returns an active swipe
    When SwipeableItem is rendered with swipeRight configured
    Then content layer has transition none

  @swipeable-item @FR14
  Scenario: Snap-back with transition on release
    Given useSwipeGesture returns idle state after release
    When SwipeableItem is rendered with swipeRight configured
    Then content layer has snap-back transition

  @swipeable-item @FR13
  Scenario: Disabled SwipeableItem passes isEnabled to hook
    When SwipeableItem is rendered with isEnabled false
    Then useSwipeGesture receives isEnabled false

  @swipeable-item @FR13
  Scenario: Suspended SwipeableItem passes isSuspended to hook
    When SwipeableItem is rendered with isSuspended true
    Then useSwipeGesture receives isSuspended true

  @swipeable-item @NFR-P3
  Scenario: Container has touch-action pan-y
    When SwipeableItem is rendered with children
    Then the container element has style touch-action set to pan-y

  @swipeable-item @NFR-A2
  Scenario: Background has aria-hidden
    Given useSwipeGesture returns a right swipe in progress
    When SwipeableItem is rendered with swipeRight configured
    Then the background element has aria-hidden true
