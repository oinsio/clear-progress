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

describe("useSwipeAction — right swipe below threshold", () => {
  let context: SwipeTestContext;

  beforeEach(() => {
    context = setupSwipeTest();
  });

  afterEach(() => {
    cleanupSwipeTest(context.element);
  });

  it("should update translateX during right swipe", () => {
    const { result } = renderSwipeHook(context.ref);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, 40, 0);
    });
    expect(result.current.translateX).toBe(40);
  });

  it("should not set isThresholdReached when swipe is below threshold", () => {
    const { result } = renderSwipeHook(context.ref);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, context.threshold - 1, 0);
    });
    expect(result.current.isThresholdReached).toBe(false);
  });

  it("should reset translateX to 0 on touchend below threshold", () => {
    const { result } = renderSwipeHook(context.ref);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, 40, 0);
      fireTouchEnd(context.element);
    });
    expect(result.current.translateX).toBe(0);
  });

  it("should not call onComplete on touchend below threshold", () => {
    const onAction = vi.fn();
    renderSwipeHook(context.ref, onAction);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, context.threshold - 1, 0);
      fireTouchEnd(context.element);
    });
    expect(onAction).not.toHaveBeenCalled();
  });
});
