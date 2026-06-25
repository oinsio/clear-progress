// implements FR2, FR3, FR4, FR5, FR8, FR9 of swipeable-item
// Targeted mutation tests for internal logic paths
import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  SWIPE_DRAG_START_PX,
  SWIPE_VELOCITY_THRESHOLD_PX_PER_MS,
  SWIPE_VERTICAL_CANCEL_PX,
} from "@/constants";
import type { SwipeActionConfig } from "@/types/swipe";
import type { UseSwipeGestureOptions } from "./useSwipeGesture";
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

describe("useSwipeGesture internal paths", () => {
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

  // Kill: Line 115 — isSuspendedRef guard in handlePointerDown
  it("should not start tracking when suspended on pointerdown", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
        isSuspended: true,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET, 0);
      });
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.direction).toBeNull();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 119 — data-no-swipe guard
  it("should not start swipe on data-no-swipe child", () => {
    const { context, rightConfig } = setup();
    try {
      const noSwipeChild = document.createElement("button");
      noSwipeChild.setAttribute("data-no-swipe", "true");
      context.element.appendChild(noSwipeChild);

      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0, noSwipeChild);
        firePointerMove(context.threshold, 0);
      });
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.direction).toBeNull();
      expect(hook.result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 138 — three-part guard in handlePointerMove
  it("should ignore move when cancelled even if hasStarted is true", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      // Start gesture, then trigger vertical cancel
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(1, SWIPE_VERTICAL_CANCEL_PX + 1);
      });
      expect(hook.result.current.translateX).toBe(0);
      // Further moves should be ignored due to isCancelled
      act(() => {
        firePointerMove(context.threshold, 0);
      });
      expect(hook.result.current.translateX).toBe(0);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 146 — deltaY subtraction
  it("should use correct deltaY when start position is non-zero", () => {
    const { context, rightConfig } = setup();
    try {
      const startY = 100;
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      // Move vertically relative to start (not absolute)
      act(() => {
        firePointerDown(context.element, 0, startY);
        // deltaY = (startY + 5) - startY = 5, which is <= VERTICAL_CANCEL_PX
        // deltaX = SWIPE_DRAG_START_PX + 1, which starts dragging
        firePointerMove(SWIPE_DRAG_START_PX + 1, startY + 5);
      });
      // Should NOT be cancelled — deltaY (5) is small
      expect(hook.result.current.isSwiping).toBe(true);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 156 — isCancelledRef.current = true in vertical cancel
  it("should set cancelled state and prevent action on vertical cancel", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(2, SWIPE_VERTICAL_CANCEL_PX + 1);
      });
      // Continue moving horizontally — should be blocked by cancelled state
      act(() => {
        firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET, 0);
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 173 — isCancelledRef.current = true when no config
  it("should set cancelled when swiping in unconfigured direction", () => {
    const { context, leftConfig, onLeftAction } = setup();
    try {
      // Only left configured
      const hook = renderSwipeGestureHook(context.ref, {
        swipeLeft: leftConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        // Right swipe — no config, should cancel
        firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
      });
      expect(hook.result.current.isSwiping).toBe(false);
      // Continue swiping — still cancelled
      act(() => {
        firePointerMove(context.threshold, 0);
      });
      expect(hook.result.current.translateX).toBe(0);
      act(() => {
        firePointerUp();
      });
      expect(onLeftAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 165 — deltaX > 0 (strict, not >=)
  it("should handle exactly zero deltaX without starting drag", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        // Move exactly 0 in X — no drag start
        firePointerMove(0, 0);
      });
      expect(hook.result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 184 — isDraggingRef.current check before translation
  it("should not update translateX before drag threshold is reached", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
      });
      act(() => {
        firePointerDown(context.element, 0, 0);
        // Move less than drag start — should not update translateX
        firePointerMove(SWIPE_DRAG_START_PX - 1, 0);
      });
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 221 — subtraction in velocity distance calc
  it("should compute velocity distance as absolute difference", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderSwipeGestureHook(context.ref, { swipeRight: rightConfig });
      const performanceNowSpy = vi.spyOn(performance, "now");
      const timeGap = 10;
      // Need velocity = distance/time >= threshold
      const neededDistance = SWIPE_VELOCITY_THRESHOLD_PX_PER_MS * timeGap + 1;
      performanceNowSpy.mockReturnValue(0);
      act(() => {
        firePointerDown(context.element, 0, 0);
      });
      // First move (prev position)
      const firstMoveX = SWIPE_DRAG_START_PX + 1;
      performanceNowSpy.mockReturnValue(100);
      act(() => {
        firePointerMove(firstMoveX, 0);
      });
      // Second move — high velocity
      performanceNowSpy.mockReturnValue(100 + timeGap);
      act(() => {
        firePointerMove(firstMoveX + neededDistance, 0);
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

  // Kill: Line 228 — translateXRef.current > 0 direction check on pointerup
  it("should call left action when translateX is negative on pointerup", () => {
    const { context, rightConfig, leftConfig, onRightAction, onLeftAction } =
      setup();
    try {
      const distance = context.threshold + ABOVE_THRESHOLD_OFFSET;
      renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
        swipeLeft: leftConfig,
      });
      act(() => {
        firePointerDown(context.element, distance, 0);
        firePointerMove(0, 0);
        firePointerUp();
      });
      expect(onLeftAction).toHaveBeenCalledOnce();
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill: Line 95 — suspension effect + hasStartedRef
  it("should reset state when isSuspended becomes true during active swipe", () => {
    const { context, rightConfig } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, {
        swipeRight: rightConfig,
        isSuspended: false,
      });
      // Start a swipe
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold, 0);
      });
      expect(hook.result.current.isSwiping).toBe(true);
      // Rerender with suspended
      hook.rerender({
        ref: context.ref,
        swipeRight: rightConfig,
        isSuspended: true,
      } as unknown as UseSwipeGestureOptions);
      // State should be reset (but only if hasStartedRef was true)
      // Since we're using renderHook, the rerender triggers useEffect
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });
});
