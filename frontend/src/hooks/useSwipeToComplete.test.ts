import { renderHook, act } from "@testing-library/react";
import React, { createRef } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSwipeToComplete } from "./useSwipeToComplete";
import { SWIPE_COMPLETE_THRESHOLD_PERCENT } from "@/constants";

function createElementRef() {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const ref = createRef<HTMLDivElement>();
  Object.defineProperty(ref, "current", { value: element, writable: false });
  return { element, ref };
}

function makeTouchList(x: number, y: number, target: HTMLElement) {
  return [
    { identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y },
  ];
}

function fireTouchStart(
  el: HTMLElement,
  x: number,
  y: number,
  target?: HTMLElement,
) {
  const touchTarget = target ?? el;
  const event = Object.assign(
    new Event("touchstart", { bubbles: true, cancelable: true }),
    {
      touches: makeTouchList(x, y, touchTarget),
    },
  );
  touchTarget.dispatchEvent(event);
}

function fireTouchMove(el: HTMLElement, x: number, y: number) {
  const event = Object.assign(
    new Event("touchmove", { bubbles: true, cancelable: true }),
    {
      touches: makeTouchList(x, y, el),
    },
  );
  el.dispatchEvent(event);
}

function fireTouchEnd(el: HTMLElement) {
  const event = Object.assign(
    new Event("touchend", { bubbles: true, cancelable: true }),
    {
      touches: [],
    },
  );
  el.dispatchEvent(event);
}

describe("useSwipeToComplete", () => {
  let element: HTMLElement;
  let ref: React.RefObject<HTMLDivElement>;
  let threshold: number;

  beforeEach(() => {
    // Set window width for consistent testing
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375, // iPhone SE width
    });
    threshold = window.innerWidth * SWIPE_COMPLETE_THRESHOLD_PERCENT; // 150px

    const created = createElementRef();
    element = created.element;
    ref = created.ref;
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  // Initial state
  it("should return translateX 0 initially", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    expect(result.current.translateX).toBe(0);
  });

  it("should return isThresholdReached false initially", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    expect(result.current.isThresholdReached).toBe(false);
  });

  // When disabled
  it("should not change translateX when isEnabled is false", () => {
    const { result } = renderHook(() =>
      useSwipeToComplete(ref, vi.fn(), false),
    );
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 50, 0);
    });
    expect(result.current.translateX).toBe(0);
  });

  it("should not call onComplete when isEnabled is false", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, false));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, threshold + 10, 0);
      fireTouchEnd(element);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  // Right swipe below threshold
  it("should update translateX during right swipe", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 40, 0);
    });
    expect(result.current.translateX).toBe(40);
  });

  it("should not set isThresholdReached when swipe is below threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, threshold - 1, 0);
    });
    expect(result.current.isThresholdReached).toBe(false);
  });

  it("should reset translateX to 0 on touchend below threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 40, 0);
      fireTouchEnd(element);
    });
    expect(result.current.translateX).toBe(0);
  });

  it("should not call onComplete on touchend below threshold", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, threshold - 1, 0);
      fireTouchEnd(element);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  // Right swipe at/above threshold
  it("should set isThresholdReached when swipe reaches threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, threshold, 0);
    });
    expect(result.current.isThresholdReached).toBe(true);
  });

  it("should call onComplete on touchend when threshold is reached", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, threshold + 10, 0);
      fireTouchEnd(element);
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("should reset translateX and isThresholdReached on touchend after threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, threshold + 10, 0);
      fireTouchEnd(element);
    });
    expect(result.current.translateX).toBe(0);
    expect(result.current.isThresholdReached).toBe(false);
  });

  // Left swipe
  it("should not update translateX on left swipe", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 100, 0);
      fireTouchMove(element, 50, 0);
    });
    expect(result.current.translateX).toBe(0);
  });

  it("should not call onComplete on left swipe touchend", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, true));
    act(() => {
      fireTouchStart(element, 200, 0);
      fireTouchMove(element, 50, 0);
      fireTouchEnd(element);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  // Rubber-band clamping
  it("should clamp translateX at 1.5x threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, threshold * 3, 0);
    });
    expect(result.current.translateX).toBe(threshold * 1.5);
  });

  // Cleanup
  it("should remove event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(element, "removeEventListener");
    const { unmount } = renderHook(() =>
      useSwipeToComplete(ref, vi.fn(), true),
    );
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
    element.appendChild(noSwipeChild);

    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0, noSwipeChild);
      fireTouchMove(element, threshold + 10, 0);
    });
    expect(result.current.translateX).toBe(0);
  });

  // Window resize
  it("should recalculate threshold on window resize", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));

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
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, newThreshold, 0);
    });

    expect(result.current.isThresholdReached).toBe(true);
  });

  // Boundary tests
  it.each([
    ["threshold - 1", -1, false],
    ["threshold", 0, true],
    ["threshold + 1", 1, true],
  ] as const)(
    "onComplete called=%s when swipe is %s relative to threshold",
    (_label, offset, shouldCall) => {
      const onComplete = vi.fn();
      renderHook(() => useSwipeToComplete(ref, onComplete, true));
      act(() => {
        fireTouchStart(element, 0, 0);
        fireTouchMove(element, threshold + offset, 0);
        fireTouchEnd(element);
      });
      if (shouldCall) {
        expect(onComplete).toHaveBeenCalledOnce();
      } else {
        expect(onComplete).not.toHaveBeenCalled();
      }
    },
  );
});
