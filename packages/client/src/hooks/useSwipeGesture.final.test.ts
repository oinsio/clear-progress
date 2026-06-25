// implements FR2, FR3, FR5, FR8, FR11 of swipeable-item
// Final batch of targeted mutation-killing tests
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SWIPE_DRAG_START_PX } from "@/constants";
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

describe("useSwipeGesture final mutation killers", () => {
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

  // Kill L95: isSuspended && hasStartedRef → true (always resets)
  // If mutant makes it `true`, resetState runs on every render
  // Test: render non-suspended, do a gesture, verify state is maintained mid-gesture
  it("should NOT reset state on re-render when not suspended", () => {
    const { context, rightConfig } = setup();
    try {
      const { result, rerender } = renderHook(
        (props: UseSwipeGestureOptions) => useSwipeGesture(props),
        {
          initialProps: {
            ref: context.ref,
            swipeRight: rightConfig,
            isSuspended: false,
          },
        },
      );
      // Start gesture
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold, 0);
      });
      expect(result.current.translateX).toBe(context.threshold);
      // Re-render with same props (isSuspended still false)
      act(() => {
        rerender({
          ref: context.ref,
          swipeRight: rightConfig,
          isSuspended: false,
        });
      });
      // State should be maintained — NOT reset
      // If mutant makes condition `true`, this would be 0
      expect(result.current.translateX).toBe(context.threshold);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L206/L211: pointerup guard conditions
  // L206: !hasStartedRef.current → false means cleanup never runs early
  // L211: isDraggingRef.current → true means action logic runs even without drag
  it("should skip action logic but still reset when pointerup without drag", () => {
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
      // pointerdown, small move (below drag start), then pointerup
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DRAG_START_PX - 1, 0);
      });
      expect(result.current.isSwiping).toBe(false);
      act(() => {
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
      // State should be reset
      expect(result.current.translateX).toBe(0);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L228: translateXRef.current > 0 → >= 0
  // Need to test with both positive and negative translateX
  it.each([
    {
      direction: "right" as const,
      startX: 0,
      endX: ABOVE_THRESHOLD_OFFSET,
      expectedAction: "onRightAction",
      unexpectedAction: "onLeftAction",
    },
    {
      direction: "left" as const,
      startX: ABOVE_THRESHOLD_OFFSET,
      endX: 0,
      expectedAction: "onLeftAction",
      unexpectedAction: "onRightAction",
    },
  ])("should call $direction config when swiped $direction past threshold", ({
    startX,
    endX,
    expectedAction,
    unexpectedAction,
  }) => {
    const setupResult = setup();
    const { context, rightConfig, leftConfig } = setupResult;
    try {
      const distance = context.threshold + ABOVE_THRESHOLD_OFFSET;
      renderHook((props: UseSwipeGestureOptions) => useSwipeGesture(props), {
        initialProps: {
          ref: context.ref,
          swipeRight: rightConfig,
          swipeLeft: leftConfig,
        },
      });
      act(() => {
        firePointerDown(context.element, startX === 0 ? 0 : distance, 0);
        firePointerMove(endX === 0 ? 0 : distance, 0);
        firePointerUp();
      });
      expect(
        setupResult[expectedAction as keyof typeof setupResult],
      ).toHaveBeenCalledOnce();
      expect(
        setupResult[unexpectedAction as keyof typeof setupResult],
      ).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L138: || → && in handlePointerMove guard
  // The guard: isSuspendedRef.current || !hasStartedRef.current || isCancelledRef.current
  // If changed to &&, ALL must be true to return early
  // Test: !hasStartedRef.current alone should block (fire pointermove without pointerdown)
  it("should ignore pointermove when hasStarted is false", () => {
    const { context, rightConfig } = setup();
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
      // Move without pointerdown — hasStarted is false
      act(() => {
        firePointerMove(context.threshold, 0);
      });
      expect(result.current.translateX).toBe(0);
      expect(result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L115: if (isSuspendedRef.current) return → if (false) return
  // After suspension, new gesture must be ignored even though element has listener
  it("should block all gesture flow when suspended from start", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      const { result } = renderHook(
        (props: UseSwipeGestureOptions) => useSwipeGesture(props),
        {
          initialProps: {
            ref: context.ref,
            swipeRight: rightConfig,
            isSuspended: true,
          },
        },
      );
      act(() => {
        firePointerDown(context.element, 0, 0);
      });
      act(() => {
        firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET, 0);
      });
      act(() => {
        firePointerUp();
      });
      expect(result.current.translateX).toBe(0);
      expect(result.current.isSwiping).toBe(false);
      expect(result.current.direction).toBeNull();
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill L251: "pointerdown" → "" in cleanup
  it("should properly clean up pointerdown listener on unmount", () => {
    const { context, rightConfig } = setup();
    try {
      const removeListenerSpy = vi.spyOn(
        context.element,
        "removeEventListener",
      );
      const { unmount } = renderHook(
        (props: UseSwipeGestureOptions) => useSwipeGesture(props),
        {
          initialProps: {
            ref: context.ref,
            swipeRight: rightConfig,
          },
        },
      );
      unmount();
      expect(removeListenerSpy).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
      );
      removeListenerSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });
});
