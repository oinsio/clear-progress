import { describe, expect, it, vi } from "vitest";

import { fakeClock } from "@/lib/temporal";

import {
  BOUNDARY_BUFFER_MS,
  scheduleNextBoundary,
} from "./scheduleNextBoundary";

// implements FR8 of fix-completed-today-stale-on-day-rollover
describe("scheduleNextBoundary", () => {
  it("should schedule onFire at today's boundary when the boundary has not yet passed", () => {
    const clock = fakeClock("2026-04-16T22:00:00Z", "UTC");
    const onFire = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    scheduleNextBoundary(clock, "00:00", onFire);

    const expectedDelayMs = 2 * 60 * 60 * 1000 + BOUNDARY_BUFFER_MS;
    expect(setTimeoutSpy).toHaveBeenCalledWith(onFire, expectedDelayMs);

    setTimeoutSpy.mockRestore();
  });

  it("should schedule onFire at the next day's boundary when today's boundary already passed", () => {
    const clock = fakeClock("2026-04-16T06:00:00Z", "UTC");
    const onFire = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    scheduleNextBoundary(clock, "04:00", onFire);

    const expectedDelayMs = 22 * 60 * 60 * 1000 + BOUNDARY_BUFFER_MS;
    expect(setTimeoutSpy).toHaveBeenCalledWith(onFire, expectedDelayMs);

    setTimeoutSpy.mockRestore();
  });

  it("should schedule onFire at the next day's boundary when now is exactly at today's boundary", () => {
    const clock = fakeClock("2026-04-16T00:00:00Z", "UTC");
    const onFire = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    scheduleNextBoundary(clock, "00:00", onFire);

    const expectedDelayMs = 24 * 60 * 60 * 1000 + BOUNDARY_BUFFER_MS;
    expect(setTimeoutSpy).toHaveBeenCalledWith(onFire, expectedDelayMs);

    setTimeoutSpy.mockRestore();
  });

  it("should account for timezone when computing the boundary instant", () => {
    // 2026-04-16 20:00 UTC = 2026-04-16 23:00 Europe/Moscow (UTC+3)
    const clock = fakeClock("2026-04-16T20:00:00Z", "Europe/Moscow");
    const onFire = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    scheduleNextBoundary(clock, "00:00", onFire);

    const expectedDelayMs = 60 * 60 * 1000 + BOUNDARY_BUFFER_MS;
    expect(setTimeoutSpy).toHaveBeenCalledWith(onFire, expectedDelayMs);

    setTimeoutSpy.mockRestore();
  });

  it("should include BOUNDARY_BUFFER_MS on top of the raw time-until-boundary", () => {
    const clock = fakeClock("2026-04-16T23:59:00Z", "UTC");
    const onFire = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    scheduleNextBoundary(clock, "00:00", onFire);

    const [, delayMs] = setTimeoutSpy.mock.calls[0];
    expect(delayMs).toBe(60_000 + BOUNDARY_BUFFER_MS);

    setTimeoutSpy.mockRestore();
  });

  it("should pass onFire itself as the setTimeout callback so it fires exactly once at the boundary", () => {
    const clock = fakeClock("2026-04-16T23:59:00Z", "UTC");
    const onFire = vi.fn();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    scheduleNextBoundary(clock, "00:00", onFire);

    const [scheduledCallback] = setTimeoutSpy.mock.calls[0];
    expect(onFire).not.toHaveBeenCalled();

    scheduledCallback();
    expect(onFire).toHaveBeenCalledTimes(1);

    setTimeoutSpy.mockRestore();
  });

  it("should return the underlying setTimeout handle so callers can clear it", () => {
    const clock = fakeClock("2026-04-16T22:00:00Z", "UTC");
    const onFire = vi.fn();
    const fakeTimeoutHandle = 42 as unknown as ReturnType<typeof setTimeout>;
    const setTimeoutSpy = vi
      .spyOn(globalThis, "setTimeout")
      .mockReturnValue(fakeTimeoutHandle);

    const timeoutHandle = scheduleNextBoundary(clock, "00:00", onFire);

    expect(timeoutHandle).toBe(fakeTimeoutHandle);

    setTimeoutSpy.mockRestore();
  });
});
