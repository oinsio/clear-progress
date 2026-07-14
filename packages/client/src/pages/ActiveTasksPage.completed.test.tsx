import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Temporal } from "@/lib/temporal";
import {
  buildCompletedTasksHook,
  buildTask,
  mockUseCompletedTasks,
  pageConfig,
  renderPage,
  resetDefaultMocks,
  setFakeClock,
} from "./activeTasksPage.testSetup";

describe("ActiveTasksPage — completed tasks", () => {
  beforeEach(() => {
    resetDefaultMocks();
  });

  // FR-2: shows completed today section when there are completed tasks
  it("should show completed today section when completed tasks exist", () => {
    const todayDate = Temporal.Now.plainDateISO().toString();
    const todayTimestamp = `${todayDate}T12:00:00.000Z`;
    const completedTasks = [
      buildTask({
        name: "Done task",
        is_completed: true,
        completed_at: todayTimestamp,
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.getByText(/Done task/)).toBeInTheDocument();
  });

  // FR-2: does not show completed section when no completed tasks
  it("should not show completed today section when no completed tasks", () => {
    renderPage();
    const emptySections = screen.queryAllByTestId("task-list-empty");
    expect(emptySections.length).toBeGreaterThan(0);
  });

  // FR-2: completed tasks from yesterday should not appear in completed today section
  it("should not show yesterday completed tasks in completed today section", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const completedTasks = [
      buildTask({
        name: "Old task",
        is_completed: true,
        completed_at: yesterday.toISOString(),
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.queryByText(/Old task/)).not.toBeInTheDocument();
  });

  // FR-2: tasks without completed_at should not appear in completed today section
  it("should not show tasks without completed_at in completed today section", () => {
    const completedTasks = [
      buildTask({
        name: "No date task",
        is_completed: true,
        completed_at: "",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.queryByText(/No date task/)).not.toBeInTheDocument();
  });

  // FR1 of fix-today-completed-logical-date: completion day is derived from the
  // completed_at instant in the user's timezone, never from a UTC date slice
  it("should show early-morning completion in completed today when its UTC date is yesterday", () => {
    // Arrange: UTC+5 (Asia/Almaty), now 2026-06-09T21:30:00Z = 02:30 June 10 local,
    // day boundary "00:00" (default); task completed 21:00Z June 9 = 02:00 June 10 local
    setFakeClock("2026-06-09T21:30:00Z", "Asia/Almaty");
    const completedTasks = [
      buildTask({
        name: "Early morning task",
        is_completed: true,
        completed_at: "2026-06-09T21:00:00.000Z",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    // Act
    renderPage();
    // Assert: task belongs to logical today (June 10 local) despite UTC date June 9
    expect(screen.getByText(/Early morning task/)).toBeInTheDocument();
  });

  // FR1 of fix-today-completed-logical-date: completion day is derived from the
  // completed_at instant in the user's timezone, never from a UTC date slice
  it("should show evening completion in completed today when its UTC date is tomorrow", () => {
    // Arrange: UTC-4 (America/New_York, summer), now 2026-06-10T01:30:00Z = 21:30 June 9 local,
    // day boundary "00:00" (default); task completed 01:00Z June 10 = 21:00 June 9 local
    setFakeClock("2026-06-10T01:30:00Z", "America/New_York");
    const completedTasks = [
      buildTask({
        name: "Evening task",
        is_completed: true,
        completed_at: "2026-06-10T01:00:00.000Z",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    // Act
    renderPage();
    // Assert: task belongs to logical today (June 9 local) despite UTC date June 10
    expect(screen.getByText(/Evening task/)).toBeInTheDocument();
  });

  // FR1 of fix-today-completed-logical-date: completion day is derived from the
  // completed_at instant compared against the logical day start at the custom
  // day boundary, never from a UTC date slice
  it("should show post-boundary completion in completed today when custom boundary applies and its UTC date is yesterday", () => {
    // Arrange: UTC+5 (Asia/Almaty), day boundary "04:00",
    // now 2026-06-10T07:00:00Z = 12:00 June 10 local — after the boundary,
    // so the logical day is June 10;
    // task completed 23:30Z June 9 = 04:30 June 10 local — after the June 10
    // logical day started at 04:00 local, while the UTC date of completed_at
    // is still June 9
    pageConfig.dayBoundary = "04:00";
    setFakeClock("2026-06-10T07:00:00Z", "Asia/Almaty");
    const completedTasks = [
      buildTask({
        name: "Post-boundary task",
        is_completed: true,
        completed_at: "2026-06-09T23:30:00.000Z",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    // Act
    renderPage();
    // Assert: task belongs to logical today (June 10) despite UTC date June 9
    expect(screen.getByText(/Post-boundary task/)).toBeInTheDocument();
  });

  // FR1 of fix-today-completed-logical-date: green-only regression guard —
  // expected to pass both before and after the implementation fix; pins that
  // the custom day boundary shifts logical "today" for the completed section
  // (fails if pageConfig.dayBoundary stops reaching the page)
  it("should show daytime completion in completed today when custom boundary keeps logical day on previous date", () => {
    // Arrange: UTC+5 (Asia/Almaty), day boundary "04:00",
    // now 2026-06-09T21:30:00Z = 02:30 June 10 local — before the boundary,
    // so the logical day is still June 9;
    // task completed 05:00Z June 9 = 10:00 June 9 local,
    // after the June 9 logical day started at 04:00 local
    pageConfig.dayBoundary = "04:00";
    setFakeClock("2026-06-09T21:30:00Z", "Asia/Almaty");
    const completedTasks = [
      buildTask({
        name: "Daytime task",
        is_completed: true,
        completed_at: "2026-06-09T05:00:00.000Z",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    // Act
    renderPage();
    // Assert: task belongs to logical today (June 9) under the "04:00" boundary
    expect(screen.getByText(/Daytime task/)).toBeInTheDocument();
  });

  // FR-2: completed today section label is correct
  it("should render completed today section with correct label", () => {
    const todayDate = Temporal.Now.plainDateISO().toString();
    const todayTimestamp = `${todayDate}T12:00:00.000Z`;
    const completedTasks = [
      buildTask({ is_completed: true, completed_at: todayTimestamp }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.getByText(/Выполненные сегодня/)).toBeInTheDocument();
  });

  // FR-2: completed today section is not visible when there are zero completed tasks
  it("should not render completed today section when todayCompletedTasks is empty", () => {
    mockUseCompletedTasks.mockReturnValue(buildCompletedTasksHook());
    renderPage();
    expect(screen.queryByText(/Выполненные сегодня/)).not.toBeInTheDocument();
  });
});
