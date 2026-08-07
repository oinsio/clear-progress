import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import { fakeClock } from "@/lib/temporal";
import { _resetForTesting, subscribe } from "./logicalTodayStore";

// implements FR2, NFR-P1 of fix-completed-today-stale-on-day-rollover
describe("logicalTodayStore — timer lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTesting(fakeClock("2026-06-04T20:00:00Z", "UTC"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should start exactly one boundary timer regardless of subscriber count", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    const unsubscribeA = subscribe(vi.fn());
    const unsubscribeB = subscribe(vi.fn());
    const unsubscribeC = subscribe(vi.fn());

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

    unsubscribeA();
    unsubscribeB();
    unsubscribeC();
  });

  it("should attach exactly one set of re-arm listeners for many subscribers", () => {
    const documentAddSpy = vi.spyOn(document, "addEventListener");
    const windowAddSpy = vi.spyOn(window, "addEventListener");

    const unsubscribeA = subscribe(vi.fn());
    const unsubscribeB = subscribe(vi.fn());

    expect(
      documentAddSpy.mock.calls.filter(([type]) => type === "visibilitychange"),
    ).toHaveLength(1);
    expect(
      windowAddSpy.mock.calls.filter(([type]) => type === "pageshow"),
    ).toHaveLength(1);
    expect(
      windowAddSpy.mock.calls.filter(
        ([type]) => type === DAY_BOUNDARY_CHANGED_EVENT,
      ),
    ).toHaveLength(1);

    unsubscribeA();
    unsubscribeB();
  });

  it("should not clear the timer while other subscribers remain", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const unsubscribeA = subscribe(vi.fn());
    const unsubscribeB = subscribe(vi.fn());

    unsubscribeA();

    expect(clearTimeoutSpy).not.toHaveBeenCalled();

    unsubscribeB();
  });

  it("should clear the boundary timer and remove listeners on last unsubscribe", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const documentRemoveSpy = vi.spyOn(document, "removeEventListener");
    const windowRemoveSpy = vi.spyOn(window, "removeEventListener");

    const unsubscribeA = subscribe(vi.fn());
    const unsubscribeB = subscribe(vi.fn());

    unsubscribeA();
    unsubscribeB();

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(
      documentRemoveSpy.mock.calls.filter(
        ([type]) => type === "visibilitychange",
      ),
    ).toHaveLength(1);
    expect(
      windowRemoveSpy.mock.calls.filter(([type]) => type === "pageshow"),
    ).toHaveLength(1);
    expect(
      windowRemoveSpy.mock.calls.filter(
        ([type]) => type === DAY_BOUNDARY_CHANGED_EVENT,
      ),
    ).toHaveLength(1);
  });

  it("should start a fresh timer when a new subscriber registers after teardown", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    const unsubscribeA = subscribe(vi.fn());
    unsubscribeA();
    setTimeoutSpy.mockClear();

    const unsubscribeB = subscribe(vi.fn());

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

    unsubscribeB();
  });
});
