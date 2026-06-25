// implements FR1, FR5, FR6, FR8, FR11 of swipeable-item
// Mutation tests for internal ref management and state reset

import { act } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { SWIPE_DRAG_START_PX } from "@/constants";
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
const SECOND_SWIPE_DISTANCE_PX = 60;

describe("useSwipeGesture ref tracking", () => {
  const setup = () => {
    const context = setupSwipeGestureTest();
    const onAction = vi.fn();
    const config: SwipeActionConfig = {
      onAction,
      color: "bg-green-500",
      icon: StubIcon,
    };
    return { context, onAction, config };
  };

  it("should reset hasStarted ref after pointerup so next gesture starts fresh", () => {
    const { context, config } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, { swipeRight: config });
      // First gesture
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DISTANCE_PX, 0);
        firePointerUp();
      });
      // Second gesture should work independently
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SECOND_SWIPE_DISTANCE_PX, 0);
      });
      expect(hook.result.current.translateX).toBe(SECOND_SWIPE_DISTANCE_PX);
      expect(hook.result.current.isSwiping).toBe(true);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should reset isDragging ref after pointerup", () => {
    const { context, config } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, { swipeRight: config });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DISTANCE_PX, 0);
      });
      expect(hook.result.current.isSwiping).toBe(true);
      act(() => {
        firePointerUp();
      });
      expect(hook.result.current.isSwiping).toBe(false);
      // New gesture should not immediately be in dragging state
      act(() => {
        firePointerDown(context.element, 0, 0);
      });
      expect(hook.result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should reset isCancelled ref after pointerup so next gesture is not pre-cancelled", () => {
    const { context, config } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, { swipeRight: config });
      // Trigger a vertical cancel
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(2, 20);
      });
      expect(hook.result.current.translateX).toBe(0);
      act(() => {
        firePointerUp();
      });
      // Next gesture should work normally
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DISTANCE_PX, 0);
      });
      expect(hook.result.current.translateX).toBe(SWIPE_DISTANCE_PX);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should reset translateX ref after pointerup", () => {
    const { context, config } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, { swipeRight: config });
      act(() => {
        firePointerDown(context.element, 0, 0);
        firePointerMove(SWIPE_DISTANCE_PX, 0);
      });
      expect(hook.result.current.translateX).toBe(SWIPE_DISTANCE_PX);
      act(() => {
        firePointerUp();
      });
      expect(hook.result.current.translateX).toBe(0);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should not track pointer movement before pointerdown", () => {
    const { context, config } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, { swipeRight: config });
      // Move without pointerdown
      act(() => {
        firePointerMove(SWIPE_DISTANCE_PX, 0);
      });
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should ignore pointermove after vertical cancellation", () => {
    const { context, config } = setup();
    try {
      const hook = renderSwipeGestureHook(context.ref, { swipeRight: config });
      act(() => {
        firePointerDown(context.element, 0, 0);
        // Vertical movement cancels
        firePointerMove(2, 20);
      });
      // Further horizontal move should still be ignored
      act(() => {
        firePointerMove(SWIPE_DISTANCE_PX, 0);
      });
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.isSwiping).toBe(false);
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should handle null ref element without crashing", () => {
    const { context, config } = setup();
    try {
      const nullRef = { current: null } as React.RefObject<HTMLElement | null>;
      const hook = renderSwipeGestureHook(nullRef, {
        swipeRight: config,
      });
      expect(hook.result.current.translateX).toBe(0);
      expect(hook.result.current.isSwiping).toBe(false);
      hook.unmount();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });

  it("should reset moveCount ref after pointerup for velocity calculation", () => {
    const { context, config, onAction } = setup();
    try {
      const performanceNowSpy = vi.spyOn(performance, "now");
      renderSwipeGestureHook(context.ref, {
        swipeRight: config,
      });
      // First gesture with multiple moves
      performanceNowSpy.mockReturnValue(0);
      act(() => {
        firePointerDown(context.element, 0, 0);
      });
      performanceNowSpy.mockReturnValue(10);
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
      });
      performanceNowSpy.mockReturnValue(20);
      act(() => {
        firePointerMove(SWIPE_DISTANCE_PX, 0);
      });
      act(() => {
        firePointerUp();
      });
      onAction.mockClear();

      // Second gesture with only 1 move (should not trigger velocity)
      performanceNowSpy.mockReturnValue(100);
      act(() => {
        firePointerDown(context.element, 0, 0);
      });
      performanceNowSpy.mockReturnValue(101);
      act(() => {
        firePointerMove(SWIPE_DRAG_START_PX + 2, 0);
      });
      act(() => {
        firePointerUp();
      });
      // With only 1 move and below distance threshold, action should NOT fire
      expect(onAction).not.toHaveBeenCalled();
      performanceNowSpy.mockRestore();
    } finally {
      cleanupSwipeGestureTest(context.element);
    }
  });
});
