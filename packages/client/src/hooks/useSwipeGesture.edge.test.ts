// implements FR2, FR3, FR4, FR8 of swipeable-item
// Edge case tests targeting specific mutant survivors
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SWIPE_DRAG_START_PX, SWIPE_VERTICAL_CANCEL_PX } from "@/constants";
import type { SwipeActionConfig } from "@/types/swipe";
import {
  type UseSwipeGestureOptions,
  useSwipeGesture,
} from "./useSwipeGesture";
import {
  cleanupSwipeGestureTest,
  firePointerDown,
  firePointerMove,
  firePointerUp,
  StubIcon,
  setupSwipeGestureTest,
} from "./useSwipeGesture.test-utils";

const ABOVE_THRESHOLD_OFFSET = 10;

describe("useSwipeGesture edge cases for mutant killing", () => {
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

  // Kill L165/L195: deltaX > 0 → deltaX >= 0
  // When deltaX is exactly 0, direction check returns "left" (not "right")
  // This means if we start at 0 and move to exactly DRAG_START_PX,
  // the deltaX will be > 0 so direction = "right"
  // Edge: deltaX exactly 0 should not trigger direction detection
  it("should not detect direction when horizontal movement is exactly zero", () => {
    const { context, rightConfig, leftConfig } = setup();
    try {
      const { result } = renderHook(
        (props: UseSwipeGestureOptions) => useSwipeGesture(props),
        {
          initialProps: {
            ref: context.ref,
            swipeRight: rightConfig,
            swipeLeft: leftConfig,
          },
        },
      );
      act(() => {
        firePointerDown(context.element, 50, 0);
        // Move to exact same X — deltaX = 0
        firePointerMove(50, 0);
      });
      expect(result.current.direction).toBeNull();
      expect(result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L152: absY > absX → absY >= absX
  // When absY === absX and absY > VERTICAL_CANCEL_PX, the mutant changes behavior
  it("should NOT cancel when absY equals absX even if above vertical threshold", () => {
    const { context, rightConfig } = setup();
    try {
      const equalDistance = SWIPE_VERTICAL_CANCEL_PX + 1;
      const { result } = renderHook(
        (props: UseSwipeGestureOptions) => useSwipeGesture(props),
        {
          initialProps: {
            ref: context.ref,
            swipeRight: rightConfig,
          },
        },
      );
      act(() => {
        firePointerDown(context.element, 0, 0);
        // absY === absX, both > VERTICAL_CANCEL_PX
        // Original: absY > absX is false → no vertical cancel
        // Mutant (>=): absY >= absX is true → vertical cancel
        firePointerMove(equalDistance, equalDistance);
      });
      // Should have started drag (not cancelled)
      expect(result.current.isSwiping).toBe(true);
      expect(result.current.direction).toBe("right");
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L156: isCancelledRef.current = true → = false
  // After vertical cancel, subsequent horizontal moves must remain blocked
  it("should permanently block gesture after vertical cancel until pointerup", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      const { result } = renderHook(
        (props: UseSwipeGestureOptions) => useSwipeGesture(props),
        {
          initialProps: {
            ref: context.ref,
            swipeRight: rightConfig,
          },
        },
      );
      act(() => {
        firePointerDown(context.element, 0, 0);
        // Vertical cancel
        firePointerMove(1, SWIPE_VERTICAL_CANCEL_PX + 1);
      });
      // Multiple subsequent moves should all be blocked
      act(() => {
        firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET, 0);
      });
      act(() => {
        firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET + 10, 0);
      });
      expect(result.current.translateX).toBe(0);
      expect(result.current.isSwiping).toBe(false);
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L173: isCancelledRef.current = true → = false (no-config direction)
  it("should permanently block gesture when swiping in unconfigured direction", () => {
    const { context, leftConfig, onLeftAction } = setup();
    try {
      const { result } = renderHook(
        (props: UseSwipeGestureOptions) => useSwipeGesture(props),
        {
          initialProps: {
            ref: context.ref,
            swipeLeft: leftConfig,
            // No swipeRight
          },
        },
      );
      act(() => {
        firePointerDown(context.element, 0, 0);
        // Right swipe with no right config
        firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
      });
      // Should be cancelled
      expect(result.current.isSwiping).toBe(false);
      // Further moves must still be blocked
      act(() => {
        firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET, 0);
      });
      act(() => {
        firePointerMove(context.threshold * 2, 0);
      });
      expect(result.current.translateX).toBe(0);
      act(() => {
        firePointerUp();
      });
      expect(onLeftAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L221: lastMoveXRef.current - prevMoveXRef.current → +
  // Use specific X positions to verify subtraction
  it("should use subtraction for velocity distance calculation", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderHook((props: UseSwipeGestureOptions) => useSwipeGesture(props), {
        initialProps: {
          ref: context.ref,
          swipeRight: rightConfig,
        },
      });
      const performanceNowSpy = vi.spyOn(performance, "now");
      // Position prev=100, last=102 → distance=2 (subtraction)
      // If mutant uses +: distance=202, velocity=202/10=20.2 (always triggers)
      // With subtraction: distance=2, velocity=2/10=0.2 (below 0.5 threshold)
      performanceNowSpy.mockReturnValue(0);
      act(() => {
        firePointerDown(context.element, 0, 0);
      });
      // First move (becomes prev) — position 100
      performanceNowSpy.mockReturnValue(100);
      act(() => {
        firePointerMove(100, 0);
      });
      // Second move (becomes last) — position 102 (small delta)
      const timeGap = 10;
      performanceNowSpy.mockReturnValue(100 + timeGap);
      act(() => {
        firePointerMove(102, 0);
      });
      // velocity = |102-100| / 10 = 0.2 < 0.5 threshold
      // translateX = 102 < threshold, so action should NOT fire
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
      performanceNowSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L228: translateXRef.current > 0 → >= 0
  // and L228: "right" → ""
  it("should determine pointerup direction correctly for right action", () => {
    const { context, rightConfig, leftConfig, onRightAction, onLeftAction } =
      setup();
    try {
      renderHook((props: UseSwipeGestureOptions) => useSwipeGesture(props), {
        initialProps: {
          ref: context.ref,
          swipeRight: rightConfig,
          swipeLeft: leftConfig,
        },
      });
      // Positive translateX → right action
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET, 0);
        firePointerUp();
      });
      expect(onRightAction).toHaveBeenCalledOnce();
      expect(onLeftAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L233: optional chaining removal
  it("should not throw when action config onAction is called", () => {
    const { context, rightConfig } = setup();
    try {
      renderHook((props: UseSwipeGestureOptions) => useSwipeGesture(props), {
        initialProps: {
          ref: context.ref,
          swipeRight: rightConfig,
        },
      });
      // This should not throw
      expect(() => {
        act(() => {
          firePointerDown(context.element, 0, 0);
          firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET, 0);
          firePointerUp();
        });
      }).not.toThrow();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });
});
