import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupSwipeTest,
  fireTouchEnd,
  fireTouchMove,
  fireTouchStart,
  renderSwipeHook,
  type SwipeTestContext,
  setupSwipeTest,
} from "./useSwipeAction.test-utils";

describe("useSwipeAction — right swipe at/above threshold", () => {
  let context: SwipeTestContext;

  beforeEach(() => {
    context = setupSwipeTest();
  });

  afterEach(() => {
    cleanupSwipeTest(context.element);
  });

  it("should set isThresholdReached when swipe reaches threshold", () => {
    const { result } = renderSwipeHook(context.ref);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, context.threshold, 0);
    });
    expect(result.current.isThresholdReached).toBe(true);
  });

  it("should call onComplete on touchend when threshold is reached", () => {
    const onAction = vi.fn();
    renderSwipeHook(context.ref, onAction);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, context.threshold + 10, 0);
      fireTouchEnd(context.element);
    });
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("should reset translateX and isThresholdReached on touchend after threshold", () => {
    const { result } = renderSwipeHook(context.ref);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, context.threshold + 10, 0);
      fireTouchEnd(context.element);
    });
    expect(result.current.translateX).toBe(0);
    expect(result.current.isThresholdReached).toBe(false);
  });

  // Boundary tests
  it.each([
    ["threshold - 1", -1, false],
    ["threshold", 0, true],
    ["threshold + 1", 1, true],
  ] as const)("onAction called=%s when swipe is %s relative to threshold", (_label, offset, shouldCall) => {
    const onAction = vi.fn();
    renderSwipeHook(context.ref, onAction);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, context.threshold + offset, 0);
      fireTouchEnd(context.element);
    });
    if (shouldCall) {
      expect(onAction).toHaveBeenCalledOnce();
    } else {
      expect(onAction).not.toHaveBeenCalled();
    }
  });
});
