import { act, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";
import { _resetForTesting } from "@/stores/logicalTodayStore";
import { createMutableClock } from "@/test/helpers/mutableClock";
import {
  buildCompletedTasksHook,
  buildTask,
  mockUseCompletedTasks,
  renderPage,
  resetDefaultMocks,
  setFakeClock,
} from "./activeTasksPage.testSetup";

/**
 * Closes the timer → recompute → UI gap for
 * fix-completed-today-stale-on-day-rollover. The sibling
 * `ActiveTasksPage.dayRollover.test.tsx` drives the recompute via
 * `DAY_BOUNDARY_CHANGED_EVENT` as a stand-in; here we exercise the genuine
 * end-to-end path: mount the page, capture the self-rescheduling boundary
 * timer the store arms on subscribe, advance the clock past the boundary,
 * and invoke the captured timer callback — never `vi.useFakeTimers()`, per
 * this project's temporal rules. No remount, no manual event dispatch.
 *
 * The store receives an injected mutable clock via `_resetForTesting`, while
 * the page's own `systemClock` is driven by `setFakeClock`; both are advanced
 * in lockstep so the store's recompute and the page's completed-today filter
 * observe the same wall-clock instant.
 */

/**
 * The store arms its boundary timer with a delay of hours (until the next
 * boundary), far larger than any incidental React/RTL timer, so the longest
 * scheduled callback is unambiguously the boundary timer.
 */
function captureBoundaryTimerCallback(
  setTimeoutSpy: MockInstance<typeof setTimeout>,
): () => void {
  const scheduledCalls = setTimeoutSpy.mock.calls as Array<
    [() => void, number]
  >;
  const longestScheduledCall = scheduledCalls.reduce((longest, call) =>
    call[1] > longest[1] ? call : longest,
  );
  return longestScheduledCall[0];
}

const BEFORE_BOUNDARY = "2026-06-04T20:00:00Z";
const AFTER_BOUNDARY = "2026-06-05T00:30:00Z";
const TIME_ZONE = "UTC";

describe("ActiveTasksPage — day boundary rollover via the boundary timer", () => {
  beforeEach(() => {
    resetDefaultMocks();
  });

  afterEach(() => {
    _resetForTesting();
    vi.restoreAllMocks();
  });

  // implements FR3, M1 of fix-completed-today-stale-on-day-rollover
  it("should remove a task from completed today when the boundary timer fires while mounted", async () => {
    setFakeClock(BEFORE_BOUNDARY, TIME_ZONE);
    const storeClock = createMutableClock(BEFORE_BOUNDARY, TIME_ZONE);
    _resetForTesting(storeClock);
    const completedTasks = [
      buildTask({
        name: "Yesterday task",
        is_completed: true,
        completed_at: "2026-06-04T10:00:00.000Z",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    renderPage();
    expect(screen.getByText(/Yesterday task/)).toBeInTheDocument();

    const fireBoundaryTimer = captureBoundaryTimerCallback(setTimeoutSpy);
    setFakeClock(AFTER_BOUNDARY, TIME_ZONE);
    storeClock.setInstant(AFTER_BOUNDARY);
    act(() => {
      fireBoundaryTimer();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Yesterday task/)).not.toBeInTheDocument();
    });
  });
});
