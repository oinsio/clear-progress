import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import {
  captureScheduledCallback,
  createMutableClock,
} from "@/test/helpers/mutableClock";
import { _resetForTesting, getSnapshot, subscribe } from "./logicalTodayStore";

// implements FR1, FR2 of fix-completed-today-stale-on-day-rollover
describe("logicalTodayStore — recompute", () => {
  let unsubscribe: () => void;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    unsubscribe();
    vi.restoreAllMocks();
  });

  it("should emit and update the snapshot when the boundary timer fires past the boundary", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    const scheduledCallback = captureScheduledCallback(setTimeoutSpy);
    clock.setInstant("2026-06-05T00:30:00Z");
    scheduledCallback();

    expect(getSnapshot()).toBe("2026-06-05");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should not emit when the boundary timer fires but the logical date is unchanged", () => {
    const clock = createMutableClock("2026-06-04T10:00:00Z", "UTC");
    _resetForTesting(clock);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    const scheduledCallback = captureScheduledCallback(setTimeoutSpy);
    // Boundary math re-invoked without the clock actually crossing a day —
    // simulates a spurious re-arm with no real date change.
    scheduledCallback();

    expect(listener).not.toHaveBeenCalled();
  });

  it("should recompute when the tab becomes visible", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    clock.setInstant("2026-06-05T00:30:00Z");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(getSnapshot()).toBe("2026-06-05");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should not recompute when visibilitychange fires while hidden", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    clock.setInstant("2026-06-05T00:30:00Z");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(listener).not.toHaveBeenCalled();
  });

  it("should recompute on a persisted pageshow event", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    clock.setInstant("2026-06-05T00:30:00Z");
    const persistedEvent = new Event("pageshow");
    Object.defineProperty(persistedEvent, "persisted", { value: true });
    window.dispatchEvent(persistedEvent);

    expect(getSnapshot()).toBe("2026-06-05");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should not recompute on a non-persisted pageshow event", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    clock.setInstant("2026-06-05T00:30:00Z");
    const nonPersistedEvent = new Event("pageshow");
    Object.defineProperty(nonPersistedEvent, "persisted", { value: false });
    window.dispatchEvent(nonPersistedEvent);

    expect(listener).not.toHaveBeenCalled();
  });

  it("should reschedule the boundary timer when the tab becomes visible", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    setTimeoutSpy.mockClear();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it("should not reschedule the boundary timer while hidden", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });

  it("should reschedule the boundary timer on a persisted pageshow event", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    setTimeoutSpy.mockClear();

    const persistedEvent = new Event("pageshow");
    Object.defineProperty(persistedEvent, "persisted", { value: true });
    window.dispatchEvent(persistedEvent);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it("should not reschedule the boundary timer on a non-persisted pageshow event", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const nonPersistedEvent = new Event("pageshow");
    Object.defineProperty(nonPersistedEvent, "persisted", { value: false });
    window.dispatchEvent(nonPersistedEvent);

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });

  it("should recompute on DAY_BOUNDARY_CHANGED_EVENT", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    clock.setInstant("2026-06-05T00:30:00Z");
    window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));

    expect(getSnapshot()).toBe("2026-06-05");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should refresh the snapshot for the first subscriber after a full teardown", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);

    // First subscriber comes and goes, tearing the store fully down so no
    // timer keeps the snapshot current.
    subscribe(vi.fn())();

    // The clock crosses the day boundary while there are no subscribers.
    clock.setInstant("2026-06-05T00:30:00Z");

    // The first subscriber after teardown must observe the fresh logical date.
    unsubscribe = subscribe(vi.fn());

    expect(getSnapshot()).toBe("2026-06-05");
  });

  it("should clear and reschedule the boundary timer on DAY_BOUNDARY_CHANGED_EVENT", () => {
    const clock = createMutableClock("2026-06-04T20:00:00Z", "UTC");
    _resetForTesting(clock);
    const listener = vi.fn();
    unsubscribe = subscribe(listener);

    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    setTimeoutSpy.mockClear();

    window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
