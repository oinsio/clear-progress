Feature: Swipe gesture edge cases
  Implements FR7, FR8, FR9, FR10, FR11, FR12 of swipeable-item.

  @swipeable-item @FR7
  Scenario: TranslateX clamped at 1.5x threshold for right swipe
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right to 3x threshold distance
    Then translateX equals 1.5x threshold

  @swipeable-item @FR7
  Scenario: TranslateX clamped at -1.5x threshold for left swipe
    Given useSwipeGesture is rendered with swipeLeft configured
    When user swipes left to 3x threshold distance
    Then translateX equals -1.5x threshold

  @swipeable-item @FR8
  Scenario: Vertical scroll cancels swipe
    Given useSwipeGesture is rendered with swipeRight configured
    When user moves pointer predominantly vertically
    Then translateX resets to 0
    And isSwiping is false

  @swipeable-item @FR9
  Scenario: Pointer on data-no-swipe element is ignored
    Given useSwipeGesture is rendered with swipeRight configured
    And a child element has the data-no-swipe attribute
    When pointer starts on the data-no-swipe element and moves right
    Then translateX remains 0

  @swipeable-item @FR10
  Scenario: Threshold updates after window resize
    Given useSwipeGesture is rendered with swipeRight configured
    When window is resized and user swipes to new threshold
    Then isThresholdReached is true

  @swipeable-item @FR11
  Scenario: State resets after release
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right past threshold and releases
    Then translateX is 0
    And isThresholdReached is false
    And direction is null
    And isSwiping is false

  @swipeable-item @FR12
  Scenario: Listeners removed on unmount
    Given useSwipeGesture is rendered with swipeRight configured
    When the hook unmounts
    Then pointerdown listener is removed from the element
    And pointermove listener is removed from document
    And pointerup listener is removed from document
