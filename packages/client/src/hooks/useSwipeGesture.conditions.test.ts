// implements FR2, FR3, FR4, FR7, FR8, FR9 of swipeable-item
// Mutation tests for conditional logic, equality operators, arithmetic
import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  SWIPE_COMPLETE_THRESHOLD_PERCENT,
  SWIPE_DRAG_START_PX,
  SWIPE_RUBBER_BAND_FACTOR,
  SWIPE_VERTICAL_CANCEL_PX,
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

describe("useSwipeGesture conditional logic", () => {
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

  it("should use subtraction for deltaX calculation (clientX - startX)", () => {
    const { context, rightConfig } = setup();
    try {
      const startX = 100;
      const moveX = 150;
      const expectedDelta = moveX - startX;
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, startX, 0);
        firePointerMove(moveX, 0);
      });
      expect(hook.result.current.translateX).toBe(expectedDelta);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should use subtraction for deltaY calculation (clientY - startY)", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      // Move vertically enough to cancel
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(2, SWIPE_VERTICAL_CANCEL_PX + 1);
      });
      // Vertical cancel should occur
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should cancel when absY > absX AND absY > VERTICAL_CANCEL_PX", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      // absY > absX but absY <= VERTICAL_CANCEL_PX: should NOT cancel
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(2, SWIPE_VERTICAL_CANCEL_PX);
      });
      // Not cancelled — but also not enough to start dragging
      // Now move horizontally to start drag
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 1, SWIPE_VERTICAL_CANCEL_PX);
      });
      expect(hook.result.current.isSwiping).toBe(true);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should detect drag start only when absX > SWIPE_DRAG_START_PX (strict)", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      // Move exactly SWIPE_DRAG_START_PX — should NOT start drag
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DRAG_START_PX, 0);
      });
      expect(hook.result.current.isSwiping).toBe(false);
      // Move one more pixel — should start drag
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
      });
      expect(hook.result.current.isSwiping).toBe(true);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should determine direction as right when deltaX > 0", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
      });
      expect(hook.result.current.direction).toBe("right");
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should determine direction as left when deltaX < 0", () => {
    const { context, leftConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeLeft: leftConfig,
      });
      act(() => {
        firePointerDown(context.element, SWIPE_DRAG_START_PX + 1, 0);
        firePointerMove(0, 0);
      });
      expect(hook.result.current.direction).toBe("left");
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should clamp positive translateX with Math.min", () => {
    const { context, rightConfig } = setup();
    try {
      const maxTranslate = context.threshold * SWIPE_RUBBER_BAND_FACTOR;
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(maxTranslate + 100, 0);
      });
      expect(hook.result.current.translateX).toBe(maxTranslate);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should clamp negative translateX with Math.max", () => {
    const { context, leftConfig } = setup();
    try {
      const maxTranslate = context.threshold * SWIPE_RUBBER_BAND_FACTOR;
      const hook = renderSwipeGestureHook(context.ref, {
        swipeLeft: leftConfig,
      });
      act(() => {
        firePointerDown(context.element, maxTranslate + 100, 0);
        firePointerMove(0, 0);
      });
      expect(hook.result.current.translateX).toBe(-maxTranslate);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should use >= for threshold comparison", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      // Exactly at threshold — should be reached
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold, 0);
      });
      expect(hook.result.current.isThresholdReached).toBe(true);
      act(() => {
        firePointerUp();
      });
      // Just below — should not be reached
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold - 1, 0);
      });
      expect(hook.result.current.isThresholdReached).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should use multiplication for rubber band max", () => {
    const { context, rightConfig } = setup();
    try {
      const expectedMax = context.threshold * SWIPE_RUBBER_BAND_FACTOR;
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(expectedMax * 2, 0);
      });
      expect(hook.result.current.translateX).toBe(expectedMax);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should use multiplication for threshold calculation", () => {
    const { context, rightConfig } = setup();
    try {
      const expectedThreshold =
        window.innerWidth * SWIPE_COMPLETE_THRESHOLD_PERCENT;
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(expectedThreshold, 0);
      });
      expect(hook.result.current.isThresholdReached).toBe(true);
      act(() => {
        firePointerUp();
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(expectedThreshold - 1, 0);
      });
      expect(hook.result.current.isThresholdReached).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });
});
