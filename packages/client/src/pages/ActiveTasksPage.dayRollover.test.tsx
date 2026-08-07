import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import {
  buildCompletedTasksHook,
  buildTask,
  mockUseCompletedTasks,
  pageConfig,
  renderPage,
  resetDefaultMocks,
  setFakeClock,
} from "./activeTasksPage.testSetup";

/**
 * Reproduces the bug from fix-completed-today-stale-on-day-rollover: the app
 * stays mounted across a day boundary and "completed today" keeps showing
 * yesterday's tasks. `DAY_BOUNDARY_CHANGED_EVENT` is one of the re-arm
 * triggers required by FR2, so dispatching it here after moving the fake
 * clock past the boundary drives the reactive recompute without a remount —
 * standing in for the self-rescheduling boundary timer, which cannot be
 * driven with `vi.useFakeTimers()` per this project's temporal rules.
 */
describe("ActiveTasksPage — day boundary rollover", () => {
  beforeEach(() => {
    resetDefaultMocks();
  });

  // implements FR3, M1 of fix-completed-today-stale-on-day-rollover
  it("should remove a task from completed today when the day boundary is crossed while mounted", async () => {
    setFakeClock("2026-06-04T20:00:00Z", "UTC");
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
    renderPage();
    expect(screen.getByText(/Yesterday task/)).toBeInTheDocument();

    setFakeClock("2026-06-05T00:30:00Z", "UTC");
    act(() => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    await waitFor(() => {
      expect(screen.queryByText(/Yesterday task/)).not.toBeInTheDocument();
    });
  });

  // implements UX3, FR3 of fix-completed-today-stale-on-day-rollover
  it("should roll over at a custom 04:00 boundary, not at midnight", async () => {
    pageConfig.dayBoundary = "04:00";
    setFakeClock("2026-06-04T20:00:00Z", "UTC");
    const completedTasks = [
      buildTask({
        name: "Custom boundary task",
        is_completed: true,
        completed_at: "2026-06-04T10:00:00.000Z",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.getByText(/Custom boundary task/)).toBeInTheDocument();

    // Midnight passes, but the configured 04:00 boundary hasn't — task stays.
    setFakeClock("2026-06-05T01:00:00Z", "UTC");
    act(() => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });
    await waitFor(() => {
      expect(screen.getByText(/Custom boundary task/)).toBeInTheDocument();
    });

    // Clock crosses the configured 04:00 boundary — task now leaves.
    setFakeClock("2026-06-05T04:30:00Z", "UTC");
    act(() => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });
    await waitFor(() => {
      expect(
        screen.queryByText(/Custom boundary task/),
      ).not.toBeInTheDocument();
    });
  });
});
