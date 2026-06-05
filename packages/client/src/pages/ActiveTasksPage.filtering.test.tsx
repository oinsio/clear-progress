import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  buildTask,
  buildTasksHook,
  mockUseTasks,
  renderPage,
  resetDefaultMocks,
  selectBoxFilter,
} from "./activeTasksPage.testSetup";

describe("ActiveTasksPage — active task filtering", () => {
  beforeEach(() => {
    resetDefaultMocks();
  });

  // FR-2: filters out already completed tasks from active sections in all-box view
  it.each([
    {
      box: "today",
      activeName: "Active task",
      completedName: "Completed task",
    },
    {
      box: "week",
      activeName: "Active week task",
      completedName: "Completed week task",
    },
    {
      box: "later",
      activeName: "Active later task",
      completedName: "Completed later task",
    },
  ] as const)("should filter out is_completed tasks from $box section", ({
    box,
    activeName,
    completedName,
  }) => {
    const tasks = [
      buildTask({ box, name: activeName }),
      buildTask({ box, name: completedName, is_completed: true }),
    ];
    mockUseTasks.mockImplementation((requestedBox) => {
      if (requestedBox === box) return buildTasksHook({ tasks });
      return buildTasksHook();
    });
    renderPage();
    expect(screen.getByText(new RegExp(activeName))).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(completedName)),
    ).not.toBeInTheDocument();
  });

  // FR-2: filters out is_completed tasks in single box view
  it("should filter out is_completed tasks in single box view", () => {
    const weekTasks = [
      buildTask({ box: "week", name: "Active week" }),
      buildTask({ box: "week", name: "Done week", is_completed: true }),
    ];
    mockUseTasks.mockImplementation((box) => {
      if (box === "week") return buildTasksHook({ tasks: weekTasks });
      return buildTasksHook();
    });
    renderPage();
    selectBoxFilter("week");
    expect(screen.getByText(/Active week/)).toBeInTheDocument();
    expect(screen.queryByText(/Done week/)).not.toBeInTheDocument();
  });
});
