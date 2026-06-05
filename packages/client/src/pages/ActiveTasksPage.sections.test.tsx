import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  buildTask,
  buildTasksHook,
  mockUseTasks,
  renderPage,
  resetDefaultMocks,
  selectBoxFilter,
  setupAllBoxTasks,
} from "./activeTasksPage.testSetup";

describe("ActiveTasksPage — box sections", () => {
  beforeEach(() => {
    resetDefaultMocks();
  });

  // FR-2: shows three sections (today, week, later) when filter is "all"
  it("should show today/week/later sections in all-box view", () => {
    setupAllBoxTasks();
    renderPage();
    expect(screen.getAllByTestId("task-item")).toHaveLength(3);
  });

  // FR-2: specific box filter shows only that box's tasks
  it("should show only specific box tasks when filter is changed", () => {
    const todayTasks = [buildTask({ box: "today" })];
    const weekTasks = [buildTask({ box: "week" })];
    mockUseTasks.mockImplementation((box) => {
      if (box === "today") return buildTasksHook({ tasks: todayTasks });
      if (box === "week") return buildTasksHook({ tasks: weekTasks });
      return buildTasksHook();
    });
    renderPage();
    selectBoxFilter("today");
    expect(screen.getAllByTestId("task-item")).toHaveLength(1);
  });

  // FR-2: section labels are rendered with correct translated text
  it("should render section labels for today, week, later", () => {
    setupAllBoxTasks();
    renderPage();
    expect(screen.getByText(/Сегодня/)).toBeInTheDocument();
    expect(screen.getByText(/Неделя/)).toBeInTheDocument();
    expect(screen.getByText(/Позже/)).toBeInTheDocument();
  });

  // FR-2: empty message for today section uses correct translated text
  it("should render today empty message with correct translated text", () => {
    renderPage();
    expect(screen.getByText(/Задач на сегодня нет/)).toBeInTheDocument();
  });

  // FR-2: shows tasks in single box view
  it.each([
    { box: "week", taskName: "Week task" },
    { box: "later", taskName: "Later task" },
  ] as const)("should show $box tasks when $box filter is selected", ({
    box,
    taskName,
  }) => {
    const tasks = [buildTask({ box, name: taskName })];
    mockUseTasks.mockImplementation((requestedBox) => {
      if (requestedBox === box) return buildTasksHook({ tasks });
      return buildTasksHook();
    });
    renderPage();
    selectBoxFilter(box);
    expect(screen.getByText(new RegExp(taskName))).toBeInTheDocument();
  });
});
