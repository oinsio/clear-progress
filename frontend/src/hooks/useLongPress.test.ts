import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLongPress } from "./useLongPress";
import {
  LONG_PRESS_THRESHOLD_MS,
  LONG_PRESS_MOVE_THRESHOLD_PX,
} from "@/constants";
import React from "react";

// Helper functions to reduce duplication
const createTouchEvent = (
  type: string,
  x: number,
  y: number,
): React.TouchEvent => {
  const touchList = [{ clientX: x, clientY: y } as Touch];
  const event = new TouchEvent(type, {
    touches: type === "touchend" ? undefined : touchList,
    changedTouches: type === "touchend" ? touchList : undefined,
  });
  return event as unknown as React.TouchEvent;
};

const setupHook = (
  onLongPress: () => void,
  onClick?: () => void,
  threshold?: number,
  moveThreshold?: number,
) => {
  return renderHook(() =>
    useLongPress({
      onLongPress,
      onClick,
      threshold,
      moveThreshold,
    }),
  );
};

describe("useLongPress", () => {
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

  it("should call onClick on quick tap", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = setupHook(onLongPress, onClick);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    const touchEndEvent = createTouchEvent("touchend", 100, 100);

    result.current.onTouchStart(touchStartEvent);
    vi.advanceTimersByTime(200);
    result.current.onTouchEnd(touchEndEvent);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should call preventDefault on touchend when onClick is triggered", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = setupHook(onLongPress, onClick);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    const touchEndEvent = createTouchEvent("touchend", 100, 100);
    const preventDefaultSpy = vi.spyOn(touchEndEvent, "preventDefault");

    result.current.onTouchStart(touchStartEvent);
    vi.advanceTimersByTime(200);
    result.current.onTouchEnd(touchEndEvent);

    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
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
    result.current.onTouchMove(
      touchMoveEvent as unknown as React.TouchEvent,
    );

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
        { clientX: 100 + LONG_PRESS_MOVE_THRESHOLD_PX - 2, clientY: 100 } as Touch,
      ],
    });

    result.current.onTouchStart(touchStartEvent);
    result.current.onTouchMove(
      touchMoveEvent as unknown as React.TouchEvent,
    );

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

  it("should not call onClick if long press was triggered", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = setupHook(onLongPress, onClick);

    const touchStartEvent = createTouchEvent("touchstart", 100, 100);
    const touchEndEvent = createTouchEvent("touchend", 100, 100);

    result.current.onTouchStart(touchStartEvent);

    vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);

    expect(onLongPress).toHaveBeenCalledTimes(1);

    result.current.onTouchEnd(touchEndEvent);

    expect(onClick).not.toHaveBeenCalled();
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
      touches: [{ clientX: 100 + customMoveThreshold - 2, clientY: 100 } as Touch],
    });

    result.current.onTouchStart(touchStartEvent);
    result.current.onTouchMove(
      touchMoveEvent as unknown as React.TouchEvent,
    );

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

  it("should call onClick on mouse click", () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = setupHook(onLongPress, onClick);

    const mouseEvent = new MouseEvent("click");

    result.current.onClick(mouseEvent as unknown as React.MouseEvent);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
