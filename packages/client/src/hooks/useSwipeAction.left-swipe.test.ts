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

describe("useSwipeAction — left swipe", () => {
  let context: SwipeTestContext;

  beforeEach(() => {
    context = setupSwipeTest();
  });

  afterEach(() => {
    cleanupSwipeTest(context.element);
  });

  it("should not update translateX on left swipe", () => {
    const { result } = renderSwipeHook(context.ref);
    act(() => {
      fireTouchStart(context.element, 100, 0);
      fireTouchMove(context.element, 50, 0);
    });
    expect(result.current.translateX).toBe(0);
  });

  it("should not call onComplete on left swipe touchend", () => {
    const onAction = vi.fn();
    renderSwipeHook(context.ref, onAction);
    act(() => {
      fireTouchStart(context.element, 200, 0);
      fireTouchMove(context.element, 50, 0);
      fireTouchEnd(context.element);
    });
    expect(onAction).not.toHaveBeenCalled();
  });
});
