import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LONG_PRESS_MOVE_THRESHOLD_PX,
  LONG_PRESS_THRESHOLD_MS,
} from "@/constants";
import { createTouchEvent, setupHook } from "./useLongPress.test-utils";

describe("useLongPress — long press behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should call onLongPress after threshold duration", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = setupHook(onLongPress, onClick);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    result.current.onTouchStart(touchStartEvent);

    expect(onLongPress).not.toHaveBeenCalled();

    vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("should cancel long press on touchmove beyond threshold", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = setupHook(onLongPress, onClick);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [
        {
          clientX: 100 + LONG_PRESS_MOVE_THRESHOLD_PX + 5,
          clientY: 100,
        } as Touch,
      ],
    });
    const touchEndEvent = createTouchEvent(
      "touchend",
      100 + LONG_PRESS_MOVE_THRESHOLD_PX + 5,
      100,
    );

    result.current.onTouchStart(touchStartEvent);
    result.current.onTouchMove(touchMoveEvent as unknown as React.TouchEvent);

    vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);

    expect(onLongPress).not.toHaveBeenCalled();

    result.current.onTouchEnd(touchEndEvent);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("should not cancel long press on small touchmove within threshold", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = setupHook(onLongPress, onClick);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    const touchMoveEvent = new TouchEvent("touchmove", {
      touches: [
        {
          clientX: 100 + LONG_PRESS_MOVE_THRESHOLD_PX - 2,
          clientY: 100,
        } as Touch,
      ],
    });

    result.current.onTouchStart(touchStartEvent);
    result.current.onTouchMove(touchMoveEvent as unknown as React.TouchEvent);

    vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("should cancel long press on touchcancel", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = setupHook(onLongPress, onClick);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    const touchCancelEvent = new TouchEvent("touchcancel");

    result.current.onTouchStart(touchStartEvent);
    result.current.onTouchCancel(
      touchCancelEvent as unknown as React.TouchEvent,
    );

    vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
