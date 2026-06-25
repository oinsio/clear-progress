// implements FR2, FR3, FR4, FR5, FR8 of swipeable-item
// Targeted mutation tests for suspension, vertical cancel, velocity, pointerup paths
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

describe("useSwipeGesture suspension and pointerup paths", () => {
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

  // Kill Line 95: isSuspended && hasStartedRef.current — both branches
  it("should reset state when suspension activates during an active gesture", () => {
    const { context, rightConfig } = setup();
    try {
      // renderHook with initialProps so we can rerender with new props
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
      // Start a gesture
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold, 0);
      });
      expect(result.current.isSwiping).toBe(true);
      expect(result.current.translateX).toBe(context.threshold);
      // Suspend — should reset because hasStartedRef is true
      act(() => {
        rerender({
          ref: context.ref,
          swipeRight: rightConfig,
          isSuspended: true,
        });
      });
      expect(result.current.translateX).toBe(0);
      expect(result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill Line 95: isSuspended && hasStartedRef — should NOT reset when no gesture active
  it("should not reset state when suspension activates without active gesture", () => {
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
      expect(result.current.translateX).toBe(0);
      // Suspend without any gesture — no reset needed
      act(() => {
        rerender({
          ref: context.ref,
          swipeRight: rightConfig,
          isSuspended: true,
        });
      });
      expect(result.current.translateX).toBe(0);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill Line 115: isSuspendedRef.current guard in handlePointerDown
  it("should block pointerdown when suspended via ref sync", () => {
    const { context, rightConfig, onRightAction } = setup();
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
      // Suspend
      act(() => {
        rerender({
          ref: context.ref,
          swipeRight: rightConfig,
          isSuspended: true,
        });
      });
      // Try to start gesture — should be blocked
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(context.threshold + ABOVE_THRESHOLD_OFFSET, 0);
        firePointerUp();
      });
      expect(result.current.translateX).toBe(0);
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill Line 138: isSuspendedRef guard in handlePointerMove
  it("should stop tracking moves when suspension activates mid-drag", () => {
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
      // Start dragging
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
      });
      expect(result.current.isSwiping).toBe(true);
      // Suspend mid-drag — the suspension effect resets state
      act(() => {
        rerender({
          ref: context.ref,
          swipeRight: rightConfig,
          isSuspended: true,
        });
      });
      // Further moves should be blocked by isSuspendedRef check
      act(() => {
        firePointerMove(context.threshold, 0);
      });
      expect(result.current.translateX).toBe(0);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill Line 151/152: !isDraggingRef.current and vertical check
  it("should not re-check vertical cancel after dragging has started", () => {
    const { context, rightConfig } = setup();
    try {
      const { result } = renderHook(
        (props: UseSwipeGestureOptions) => useSwipeGesture(props),
        {
          initialProps: {
            ref: context.ref,
            swipeRight: rightConfig,
            isSuspended: false,
          },
        },
      );
      act(() => {
        firePointerDown(context.element, 0, 0);
        // Start drag horizontally first
        firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
      });
      expect(result.current.isSwiping).toBe(true);
      // Now move vertically — should NOT cancel because isDragging is already true
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 1, SWIPE_VERTICAL_CANCEL_PX + 5);
      });
      expect(result.current.isSwiping).toBe(true);
      expect(result.current.translateX).toBe(SWIPE_DRAG_START_PX + 1);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  // Kill Line 206: !hasStartedRef.current pointerup guard
  it("should clean up listeners on pointerup even without active gesture", () => {
    const { context, rightConfig } = setup();
    try {
      const removeSpy = vi.spyOn(document, "removeEventListener");
      renderHook((props: UseSwipeGestureOptions) => useSwipeGesture(props), {
        initialProps: {
          ref: context.ref,
          swipeRight: rightConfig,
          isSuspended: false,
        },
      });
      // pointerdown then immediate pointerup (no move)
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerUp();
      });
      // Document listeners should be cleaned up
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

  // Kill Line 211: isDraggingRef.current check in pointerup
  it("should not fire action on pointerup if drag never started", () => {
    const { context, rightConfig, onRightAction } = setup();
    try {
      renderHook((props: UseSwipeGestureOptions) => useSwipeGesture(props), {
        initialProps: {
          ref: context.ref,
          swipeRight: rightConfig,
          isSuspended: false,
        },
      });
      // pointerdown then pointerup without enough movement
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(1, 0); // below drag start
        firePointerUp();
      });
      expect(onRightAction).not.toHaveBeenCalled();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });
});
