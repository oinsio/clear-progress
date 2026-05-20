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

describe("useSwipeAction — initial state and disabled", () => {
  let context: SwipeTestContext;

  beforeEach(() => {
    context = setupSwipeTest();
  });

  afterEach(() => {
    cleanupSwipeTest(context.element);
  });

  // Initial state
  it("should return translateX 0 initially", () => {
    const { result } = renderSwipeHook(context.ref);
    expect(result.current.translateX).toBe(0);
  });

  it("should return isThresholdReached false initially", () => {
    const { result } = renderSwipeHook(context.ref);
    expect(result.current.isThresholdReached).toBe(false);
  });

  // When disabled
  it("should not change translateX when isEnabled is false", () => {
    const { result } = renderSwipeHook(context.ref, vi.fn(), false);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, 50, 0);
    });
    expect(result.current.translateX).toBe(0);
  });

  it("should not call onComplete when isEnabled is false", () => {
    const onAction = vi.fn();
    renderSwipeHook(context.ref, onAction, false);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, context.threshold + 10, 0);
      fireTouchEnd(context.element);
    });
    expect(onAction).not.toHaveBeenCalled();
  });
});
