import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskList } from "./TaskList";
import { buildTask } from "@/test/factories/taskFactory";
import "./__mocks__/taskListMocks";

const DEFAULT_OPACITY = 30;

const FOCUS_PROPS = {
  isFocusMode: true,
  focusDimmedOpacity: DEFAULT_OPACITY,
} as const;

type TaskListProps = Parameters<typeof TaskList>[0];

function buildTaskListProps(overrides: Partial<TaskListProps> = {}): TaskListProps {
  return {
    tasks: [],
    goals: [],
    contexts: [],
    categories: [],
    onComplete: vi.fn(),
    onUpdate: vi.fn(),
    onMove: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

function renderTaskList(overrides: Partial<TaskListProps> = {}) {
  return render(<TaskList {...buildTaskListProps(overrides)} />);
}

function getTaskItemOpacities(): string[] {
  return screen.getAllByTestId("task-item").map((item) => item.style.opacity);
}

function expectAllUndimmed() {
  getTaskItemOpacities().forEach((opacity) => {
    expect(opacity).toBe("");
  });
}

describe("TaskList", () => {
  it("should render empty state when tasks array is empty", () => {
    renderTaskList();
    expect(screen.getByTestId("task-list-empty")).toBeInTheDocument();
  });

  it("should display empty message text when tasks array is empty", () => {
    renderTaskList();
    expect(screen.getByText("Нет задач")).toBeInTheDocument();
  });

  it("should render a TaskItem for each task in the list", () => {
    const tasks = [buildTask(), buildTask(), buildTask()];
    renderTaskList({ tasks });
    expect(screen.getAllByTestId("task-item")).toHaveLength(3);
  });

  it("should not render empty state when tasks exist", () => {
    const tasks = [buildTask()];
    renderTaskList({ tasks });
    expect(screen.queryByTestId("task-list-empty")).not.toBeInTheDocument();
  });

  describe("focus mode dimming", () => {
    it("should not dim any tasks when focus mode is off", () => {
      const tasks = [buildTask(), buildTask()];
      renderTaskList({
        tasks,
        isFocusMode: false,
        selectedTaskId: tasks[0].id,
        focusDimmedOpacity: DEFAULT_OPACITY,
      });
      expectAllUndimmed();
    });

    it("should not dim any tasks when focus mode is on but no task is selected or expanded", () => {
      const tasks = [buildTask(), buildTask()];
      renderTaskList({
        tasks,
        ...FOCUS_PROPS,
        selectedTaskId: null,
        expandedTaskId: null,
      });
      expectAllUndimmed();
    });

    it("should dim non-selected tasks when focus mode is on and a task is selected", () => {
      const tasks = [buildTask(), buildTask(), buildTask()];
      renderTaskList({
        tasks,
        ...FOCUS_PROPS,
        selectedTaskId: tasks[0].id,
      });
      expect(getTaskItemOpacities()).toEqual(["", "0.3", "0.3"]);
    });

    it("should not dim the expanded task when focus mode is on", () => {
      const tasks = [buildTask(), buildTask(), buildTask()];
      renderTaskList({
        tasks,
        ...FOCUS_PROPS,
        expandedTaskId: tasks[1].id,
        onExpand: vi.fn(),
      });
      expect(getTaskItemOpacities()).toEqual(["0.3", "", "0.3"]);
    });
  });

  describe("controlled expandedTaskId", () => {
    it("should not reset controlled expandedTaskId when expanded task is not in this list", () => {
      const tasksInThisSection = [buildTask(), buildTask()];
      const expandedTaskFromAnotherSection = "task-from-another-section";
      const onExpand = vi.fn();

      renderTaskList({
        tasks: tasksInThisSection,
        expandedTaskId: expandedTaskFromAnotherSection,
        onExpand,
        ...FOCUS_PROPS,
      });

      expect(onExpand).not.toHaveBeenCalledWith(null);
    });

    it("should reset uncontrolled expandedTaskId when expanded task disappears from list", () => {
      const task1 = buildTask();
      const task2 = buildTask();

      const { rerender } = renderTaskList({
        tasks: [task1, task2],
        ...FOCUS_PROPS,
      });

      // In uncontrolled mode the internal expandedTaskId is managed internally.
      // We verify that after removing the task, focus dimming is not stuck.
      rerender(<TaskList {...buildTaskListProps({ tasks: [task2], ...FOCUS_PROPS })} />);

      expectAllUndimmed();
    });

    it("should dim all tasks except expanded when controlled expandedTaskId matches a task in the list", () => {
      const tasks = [buildTask(), buildTask(), buildTask()];
      renderTaskList({
        tasks,
        ...FOCUS_PROPS,
        expandedTaskId: tasks[1].id,
        onExpand: vi.fn(),
      });
      expect(getTaskItemOpacities()).toEqual(["0.3", "", "0.3"]);
    });

    it("should not dim any tasks when controlled expandedTaskId is null", () => {
      const tasks = [buildTask(), buildTask()];
      renderTaskList({
        tasks,
        ...FOCUS_PROPS,
        expandedTaskId: null,
        onExpand: vi.fn(),
      });
      expectAllUndimmed();
    });
  });
});
