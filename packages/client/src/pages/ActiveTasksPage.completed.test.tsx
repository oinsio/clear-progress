import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Temporal } from "@/lib/temporal";
import {
  buildCompletedTasksHook,
  buildTask,
  mockUseCompletedTasks,
  renderPage,
  resetDefaultMocks,
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
