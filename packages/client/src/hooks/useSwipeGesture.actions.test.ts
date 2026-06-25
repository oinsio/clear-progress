// implements FR3, FR4, FR10, FR12 of swipeable-item
// Mutation tests for action triggering, velocity, resize, cleanup
import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  SWIPE_DRAG_START_PX,
  SWIPE_VELOCITY_THRESHOLD_PX_PER_MS,
} from "@/constants";
import type { SwipeActionConfig } from "@/types/swipe";
import {
  cleanupSwipeGestureTest,
  firePointerDown,
  firePointerMove,
  firePointerUp,
  renderSwipeGestureHook,
  StubIcon,
  setupSwipeGestureTest,
} from "./useSwipeGesture.test-utils";

const ABOVE_THRESHOLD_OFFSET = 10;
const HIGH_VELOCITY_TIME_GAP_MS = 5;
const LOW_VELOCITY_TIME_GAP_MS = 1000;

function setupVelocitySpy() {
  const performanceNowSpy = vi.spyOn(performance, "now");
  performanceNowSpy.mockReturnValue(0);
  return performanceNowSpy;
}

function performFirstMove(
  performanceNowSpy: ReturnType<typeof vi.spyOn>,
  element: HTMLElement,
  timeMs: number,
) {
  performanceNowSpy.mockReturnValue(0);
  act(() => {
    firePointerDown(element, 0, 0);
  });
  performanceNowSpy.mockReturnValue(timeMs);
  act(() => {
    firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
  });
}

describe("useSwipeGesture action triggering", () => {
  const setup = () => {
    const context = setupSwipeGestureTest();
    const onRightAction = vi.fn();
    const onLeftAction = vi.fn();
    const rightConfig: SwipeActionConfig = {
      onAction: onRightAction,
      color: "bg-green-500",
      icon: StubIcon,
    };
    const leftConfig: SwipeActionConfig = {
      onAction: onLeftAction,
      color: "bg-red-500",
      icon: StubIcon,
    };
    return { context, onRightAction, onLeftAction, rightConfig, leftConfig };
  };

  it("should fire right action when distance >= threshold on release", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold, 0);
        firePointerUp();
      });
      expect(onRightAction).toHaveBeenCalledOnce();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should fire left action when distance >= threshold on release", () => {
    const { context, leftConfig, onLeftAction } = setup();
    try {
      const distance = context.threshold + ABOVE_THRESHOLD_OFFSET;
      renderSwipeGestureHook(context.ref, { swipeLeft: leftConfig });
      act(() => {
        firePointerDown(context.element, distance, 0);
        firePointerMove(0, 0);
        firePointerUp();
      });
      expect(onLeftAction).toHaveBeenCalledOnce();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should NOT fire action when distance < threshold and velocity low", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      const performanceNowSpy = setupVelocitySpy();
      performFirstMove(
        performanceNowSpy,
        context.element,
        LOW_VELOCITY_TIME_GAP_MS,
      );
      performanceNowSpy.mockReturnValue(LOW_VELOCITY_TIME_GAP_MS * 2);
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 3, 0);
      });
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
      performanceNowSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should require at least 2 pointermove events for velocity check", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      const performanceNowSpy = setupVelocitySpy();
      // Only 1 move — velocity should not be checked
      performFirstMove(performanceNowSpy, context.element, 1);
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
      performanceNowSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should compute velocity as distance/time between last two moves", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      const performanceNowSpy = setupVelocitySpy();
      performFirstMove(performanceNowSpy, context.element, 100);
      // Second move — high velocity (large distance, tiny time)
      performanceNowSpy.mockReturnValue(100 + HIGH_VELOCITY_TIME_GAP_MS);
      const velocityDistance =
        SWIPE_VELOCITY_THRESHOLD_PX_PER_MS * HIGH_VELOCITY_TIME_GAP_MS + 10;
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 1 + velocityDistance, 0);
      });
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).toHaveBeenCalledOnce();
      performanceNowSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should use >= for velocity threshold comparison", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      const performanceNowSpy = setupVelocitySpy();
      performFirstMove(performanceNowSpy, context.element, 100);
      // Exactly at velocity threshold
      const exactTime = 100;
      const exactDistance = SWIPE_VELOCITY_THRESHOLD_PX_PER_MS * exactTime;
      performanceNowSpy.mockReturnValue(200);
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 1 + exactDistance, 0);
      });
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).toHaveBeenCalledOnce();
      performanceNowSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should handle timeDelta of 0 gracefully (velocity = 0)", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      const performanceNowSpy = setupVelocitySpy();
      performFirstMove(performanceNowSpy, context.element, 50);
      // Same time for second move
      performanceNowSpy.mockReturnValue(50);
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 20, 0);
      });
      act(() => {
        firePointerUp();
      });
      // Below distance threshold and velocity = 0
      expect(onRightAction).not.toHaveBeenCalled();
      performanceNowSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });
});
