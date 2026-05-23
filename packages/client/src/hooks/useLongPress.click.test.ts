import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LONG_PRESS_THRESHOLD_MS } from "@/constants";
import { createTouchEvent, setupHook } from "./useLongPress.test-utils";

describe("useLongPress — click behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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
