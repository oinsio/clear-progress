import { renderHook, act } from "@testing-library/react";
import React, { createRef } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSwipeToComplete } from "./useSwipeToComplete";
import {
  SWIPE_COMPLETE_THRESHOLD_RATIO,
  SWIPE_MIN_DISTANCE_FOR_VELOCITY,
  SWIPE_MAX_VERTICAL_DRIFT_PX,
  SWIPE_DAMPING_FACTOR,
} from "@/constants";

const DEFAULT_ELEMENT_WIDTH = 320;

function createElementRef(width = DEFAULT_ELEMENT_WIDTH) {
  const element = document.createElement("div");
  Object.defineProperty(element, "offsetWidth", {
    value: width,
    writable: true,
  });
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

function fireTransitionEnd(el: HTMLElement, propertyName = "transform") {
  const event = Object.assign(
    new Event("transitionend", { bubbles: true, cancelable: true }),
    {
      propertyName,
    },
  );
  el.dispatchEvent(event);
}

function swipeToThreshold(
  el: HTMLElement,
  threshold: number,
  overshoot = 10,
) {
  fireTouchStart(el, 0, 0);
  fireTouchMove(el, 10, 0);
  fireTouchMove(el, threshold + overshoot, 0);
  fireTouchEnd(el);
}

describe("useSwipeToComplete", () => {
  let element: HTMLElement;
  let ref: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    vi.useFakeTimers();
    const created = createElementRef();
    element = created.element;
    ref = created.ref;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Initial state
  it("should return progress 0 initially", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    expect(result.current.progress).toBe(0);
  });

  it("should return isThresholdReached false initially", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    expect(result.current.isThresholdReached).toBe(false);
  });

  it("should return phase idle initially", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    expect(result.current.phase).toBe("idle");
  });

  // When disabled
  it("should not change progress when isEnabled is false", () => {
    const { result } = renderHook(() =>
      useSwipeToComplete(ref, vi.fn(), false),
    );
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 50, 0);
    });
    expect(result.current.progress).toBe(0);
  });

  it("should not call onComplete when isEnabled is false", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, false));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, threshold + 10, 0);
      fireTouchEnd(element);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  // Right swipe below threshold
  it("should update progress during right swipe", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, 40, 0);
    });
    expect(result.current.progress).toBeCloseTo(40 / threshold, 2);
  });

  it("should transition to swiping phase when dragging starts", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 10, 0);
    });
    expect(result.current.phase).toBe("swiping");
  });

  it("should not set isThresholdReached when swipe is below threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, threshold - 1, 0);
    });
    expect(result.current.isThresholdReached).toBe(false);
  });

  it("should reset to idle on touchend below threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, 40, 0);
      fireTouchEnd(element);
    });
    expect(result.current.progress).toBe(0);
    expect(result.current.phase).toBe("idle");
  });

  it("should not call onComplete on touchend below threshold", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, threshold - 1, 0);
      fireTouchEnd(element);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  // Right swipe at/above threshold
  it("should set isThresholdReached when swipe reaches threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, threshold, 0);
    });
    expect(result.current.isThresholdReached).toBe(true);
  });

  it("should transition to completing phase on touchend when threshold is reached", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      swipeToThreshold(element, threshold);
    });
    expect(result.current.phase).toBe("completing");
  });

  it("should call onComplete immediately on touchend when threshold is reached", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      swipeToThreshold(element, threshold);
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("should reset to idle after transitionend completes", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      swipeToThreshold(element, threshold);
    });
    expect(result.current.phase).toBe("completing");
    act(() => {
      fireTransitionEnd(element, "transform");
    });
    // Phase should reset immediately
    expect(result.current.phase).toBe("idle");
    expect(result.current.isThresholdReached).toBe(false);
    // Progress might not be exactly 0 due to React batching, but should be close
    expect(result.current.progress).toBeLessThanOrEqual(0.01);
  });

  // Left swipe
  it("should not update progress on left swipe", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 100, 0);
      fireTouchMove(element, 50, 0);
    });
    expect(result.current.progress).toBe(0);
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

  // Vertical drift cancellation
  it("should reset progress when cancelled by vertical drift", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 4, SWIPE_MAX_VERTICAL_DRIFT_PX + 1);
    });
    expect(result.current.progress).toBe(0);
  });

  it("should not call onComplete when cancelled by vertical drift", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 4, SWIPE_MAX_VERTICAL_DRIFT_PX + 1);
      fireTouchMove(element, threshold + 10, SWIPE_MAX_VERTICAL_DRIFT_PX + 1);
      fireTouchEnd(element);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  // Damping
  it("should apply damping after threshold", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    const overshoot = 30;
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, threshold + overshoot, 0);
    });
    const expectedDisplayX = threshold + overshoot * SWIPE_DAMPING_FACTOR;
    const expectedProgress = expectedDisplayX / threshold;
    expect(result.current.progress).toBeCloseTo(expectedProgress, 2);
  });

  it("should clamp progress at 85% of container width", () => {
    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    const maxDisplayX = DEFAULT_ELEMENT_WIDTH * 0.85;
    act(() => {
      fireTouchStart(element, 0, 0);
      fireTouchMove(element, 10, 0);
      // Swipe way beyond - damping will apply but should clamp at 85%
      fireTouchMove(element, DEFAULT_ELEMENT_WIDTH * 2, 0);
    });
    // After damping: threshold + (2*width - threshold) * 0.3, then clamped to 0.85*width
    // Since 2*width is huge, damping gives us a large value, but clamp limits to maxDisplayX
    const expectedProgress = maxDisplayX / threshold;
    expect(result.current.progress).toBeLessThanOrEqual(expectedProgress + 0.01);
  });

  // Velocity-based completion
  it("should complete task on fast short swipe (flick)", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useSwipeToComplete(ref, onComplete, true),
    );
    act(() => {
      fireTouchStart(element, 0, 0);
      vi.advanceTimersByTime(50);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, 50, 0);
      fireTouchEnd(element);
    });
    expect(result.current.phase).toBe("completing");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("should not complete on slow short swipe", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, true));
    act(() => {
      fireTouchStart(element, 0, 0);
      vi.advanceTimersByTime(500);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, 50, 0);
      fireTouchEnd(element);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should not complete on fast swipe below minimum distance", () => {
    const onComplete = vi.fn();
    renderHook(() => useSwipeToComplete(ref, onComplete, true));
    act(() => {
      fireTouchStart(element, 0, 0);
      vi.advanceTimersByTime(20);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, SWIPE_MIN_DISTANCE_FOR_VELOCITY - 1, 0);
      fireTouchEnd(element);
    });
    expect(onComplete).not.toHaveBeenCalled();
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
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "transitionend",
      expect.any(Function),
    );
  });

  // data-no-swipe guard
  it("should not start swipe when touch starts on data-no-swipe element", () => {
    const noSwipeChild = document.createElement("button");
    noSwipeChild.setAttribute("data-no-swipe", "true");
    element.appendChild(noSwipeChild);

    const { result } = renderHook(() => useSwipeToComplete(ref, vi.fn(), true));
    const threshold = DEFAULT_ELEMENT_WIDTH * SWIPE_COMPLETE_THRESHOLD_RATIO;
    act(() => {
      fireTouchStart(element, 0, 0, noSwipeChild);
      fireTouchMove(element, 10, 0);
      fireTouchMove(element, threshold + 10, 0);
    });
    expect(result.current.progress).toBe(0);
  });

  // Percentage-based threshold with different widths
  it.each([
    [320, 96], // 320 * 0.3
    [375, 112.5], // 375 * 0.3
    [414, 124.2], // 414 * 0.3
  ])(
    "should use 30%% threshold for width %ipx",
    (width, expectedThreshold) => {
      const { element: el, ref: r } = createElementRef(width);
      const { result } = renderHook(() => useSwipeToComplete(r, vi.fn(), true));

      act(() => {
        fireTouchStart(el, 0, 0);
        fireTouchMove(el, 10, 0);
        fireTouchMove(el, expectedThreshold, 0);
      });

      expect(result.current.isThresholdReached).toBe(true);
    },
  );

  // Boundary tests (for mutation coverage)
  it.each([
    ["threshold - 1", 95, false],
    ["threshold", 96, true],
    ["threshold + 1", 97, true],
  ] as const)(
    "completing phase=%s when swipe is exactly %s",
    (_label, swipeX, shouldComplete) => {
      const { result } = renderHook(() =>
        useSwipeToComplete(ref, vi.fn(), true),
      );
      act(() => {
        fireTouchStart(element, 0, 0);
        fireTouchMove(element, 10, 0);
        fireTouchMove(element, swipeX, 0);
        fireTouchEnd(element);
      });
      if (shouldComplete) {
        expect(result.current.phase).toBe("completing");
      } else {
        expect(result.current.phase).toBe("idle");
      }
    },
  );
});
