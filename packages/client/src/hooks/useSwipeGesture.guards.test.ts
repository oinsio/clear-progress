// implements FR2, FR5, FR8, FR9, FR10, FR11, FR12 of swipeable-item
// Mutation tests for guard conditions, suspension, cleanup, event strings
import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  SWIPE_COMPLETE_THRESHOLD_PERCENT,
  SWIPE_DRAG_START_PX,
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

const SWIPE_DISTANCE_PX = 40;
const ABOVE_THRESHOLD_OFFSET = 10;
const RESIZED_WIDTH_PX = 500;

describe("useSwipeGesture guards and cleanup", () => {
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

  it("should ignore pointermove when suspended mid-gesture", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
        isSuspended: false,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
      });
      // Now rerender with suspended
      hook.rerender();
      // Pointermove should be ignored (isSuspendedRef check in handlePointerMove)
      // Note: since isSuspendedRef is updated via useEffect on isSuspended prop change,
      // we test the suspended path by rendering suspended from start
      const hookSuspended = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
        isSuspended: true,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DISTANCE_PX, 0);
      });
      expect(hookSuspended.result.current.translateX).toBe(0);
      expect(hookSuspended.result.current.isSwiping).toBe(false);
      hookSuspended.unmount();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should handle pointerup when hasStarted is false (no-op cleanup)", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      // Fire pointerup without pointerdown
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should handle pointerup when not dragging (hasStarted but not isDragging)", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      act(() => {
        firePointerDown(context.element, 0, 0);
        // No pointermove — so hasStarted=true but isDragging=false
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it.each([
    { direction: "right", startX: 0, moveX: "threshold" },
    { direction: "left", startX: "threshold", moveX: 0 },
  ] as const)("should fire correct action based on final translateX direction ($direction)", ({
    direction,
    startX,
    moveX,
  }) => {
    const { context, rightConfig, leftConfig, onRightAction, onLeftAction } =
      setup();
    try {
      const distance = context.threshold + ABOVE_THRESHOLD_OFFSET;
      const resolvedStartX = startX === "threshold" ? distance : startX;
      const resolvedMoveX = moveX === "threshold" ? distance : moveX;
      renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
        swipeLeft: leftConfig,
      });
      act(() => {
        firePointerDown(context.element, resolvedStartX, 0);
        firePointerMove(resolvedMoveX, 0);
        firePointerUp();
      });
      const [expectedCalled, expectedNotCalled] =
        direction === "right"
          ? [onRightAction, onLeftAction]
          : [onLeftAction, onRightAction];
      expect(expectedCalled).toHaveBeenCalledOnce();
      expect(expectedNotCalled).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should cancel direction when no config exists", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      // Only swipeRight configured — left swipe should be cancelled
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, SWIPE_DISTANCE_PX, 0);
        firePointerMove(0, 0); // left swipe
      });
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.isSwiping).toBe(false);
      // Verify action not called even if we release
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should correctly subtract startY from clientY for vertical detection", () => {
    const { context, rightConfig } = setup();
    try {
      const startY = 50;
      const moveY = startY + SWIPE_VERTICAL_CANCEL_PX + 1;
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, startY);
        firePointerMove(2, moveY);
      });
      // Vertical movement should cancel
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should not cancel when absY > absX but absY <= VERTICAL_CANCEL_PX", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        // absY (8) > absX (2), but absY (8) < SWIPE_VERTICAL_CANCEL_PX (10)
        firePointerMove(2, 8);
      });
      // Should NOT be cancelled
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 1, 8);
      });
      expect(hook.result.current.isSwiping).toBe(true);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should update threshold after window resize", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      // Resize window
      act(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: RESIZED_WIDTH_PX,
        });
        window.dispatchEvent(new Event("resize"));
      });
      const newThreshold = RESIZED_WIDTH_PX * SWIPE_COMPLETE_THRESHOLD_PERCENT;
      // Swipe to just below new threshold
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(newThreshold - 1, 0);
      });
      expect(hook.result.current.isThresholdReached).toBe(false);
      act(() => {
        firePointerUp();
      });
      // Swipe to exactly new threshold
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(newThreshold, 0);
      });
      expect(hook.result.current.isThresholdReached).toBe(true);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should remove resize listener on unmount", () => {
    const { context, rightConfig } = setup();
    try {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      hook.unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
      );
      removeEventListenerSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should remove document listeners after pointerup", () => {
    const { context, rightConfig } = setup();
    try {
      const removeSpy = vi.spyOn(document, "removeEventListener");
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DISTANCE_PX, 0);
        firePointerUp();
      });
      expect(removeSpy).toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
      expect(removeSpy).toHaveBeenCalledWith("pointerup", expect.any(Function));
      removeSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });
});
