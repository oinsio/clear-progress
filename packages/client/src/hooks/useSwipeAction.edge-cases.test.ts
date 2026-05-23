import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWIPE_COMPLETE_THRESHOLD_PERCENT } from "@/constants";
import {
  cleanupSwipeTest,
  fireTouchMove,
  fireTouchStart,
  renderSwipeHook,
  type SwipeTestContext,
  setupSwipeTest,
} from "./useSwipeAction.test-utils";

describe("useSwipeAction — edge cases", () => {
  let context: SwipeTestContext;

  beforeEach(() => {
    context = setupSwipeTest();
  });

  afterEach(() => {
    cleanupSwipeTest(context.element);
  });

  // Rubber-band clamping
  it("should clamp translateX at 1.5x threshold", () => {
    const { result } = renderSwipeHook(context.ref);
    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, context.threshold * 3, 0);
    });
    expect(result.current.translateX).toBe(context.threshold * 1.5);
  });

  // Cleanup
  it("should remove event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(
      context.element,
      "removeEventListener",
    );
    const { unmount } = renderSwipeHook(context.ref);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "touchmove",
      expect.any(Function),
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "touchend",
      expect.any(Function),
    );
  });

  // data-no-swipe guard
  it("should not start swipe when touch starts on data-no-swipe element", () => {
    const noSwipeChild = document.createElement("button");
    noSwipeChild.setAttribute("data-no-swipe", "true");
    context.element.appendChild(noSwipeChild);

    const { result } = renderSwipeHook(context.ref);
    act(() => {
      fireTouchStart(context.element, 0, 0, noSwipeChild);
      fireTouchMove(context.element, context.threshold + 10, 0);
    });
    expect(result.current.translateX).toBe(0);
  });

  // Window resize
  it("should recalculate threshold on window resize", () => {
    const { result } = renderSwipeHook(context.ref);

    // Change window width
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768, // iPad width
      });
      window.dispatchEvent(new Event("resize"));
    });

    const newThreshold = 768 * SWIPE_COMPLETE_THRESHOLD_PERCENT; // 307.2px

    act(() => {
      fireTouchStart(context.element, 0, 0);
      fireTouchMove(context.element, newThreshold, 0);
    });

    expect(result.current.isThresholdReached).toBe(true);
  });
});
