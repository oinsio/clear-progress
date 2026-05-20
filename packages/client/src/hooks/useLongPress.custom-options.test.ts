import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LONG_PRESS_THRESHOLD_MS } from "@/constants";
import { createTouchEvent, setupHook } from "./useLongPress.test-utils";

describe("useLongPress — custom options", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should use custom threshold", () => {
    const onLongPress = vi.fn();
    const customThreshold = 1000;
    const { result } = setupHook(onLongPress, undefined, customThreshold);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);

    result.current.onTouchStart(touchStartEvent);

    vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);
    expect(onLongPress).not.toHaveBeenCalled();

    vi.advanceTimersByTime(customThreshold - LONG_PRESS_THRESHOLD_MS);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("should use custom move threshold", () => {
    const onLongPress = vi.fn();
    const customMoveThreshold = 20;
    const { result } = setupHook(
      onLongPress,
      undefined,
      undefined,
      customMoveThreshold,
    );

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [
        { clientX: 100 + customMoveThreshold - 2, clientY: 100 } as Touch,
      ],
    });

    result.current.onTouchStart(touchStartEvent);
    result.current.onTouchMove(touchMoveEvent as unknown as React.TouchEvent);

    vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("should work without onClick callback", () => {
    const onLongPress = vi.fn();
    const { result } = setupHook(onLongPress);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    const touchEndEvent = createTouchEvent("touchend", 100, 100);

    result.current.onTouchStart(touchStartEvent);

    vi.advanceTimersByTime(200);

    result.current.onTouchEnd(touchEndEvent);

    expect(onLongPress).not.toHaveBeenCalled();
  });
});
