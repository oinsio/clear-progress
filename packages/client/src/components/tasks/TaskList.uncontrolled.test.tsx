import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { TaskList } from "./TaskList";
import "./__mocks__/taskListMocks";

type TaskListProps = Parameters<typeof TaskList>[0];

function buildTaskListProps(
  overrides: Partial<TaskListProps> = {},
): TaskListProps {
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

describe("TaskList — uncontrolled expand behavior", () => {
  it("should expand task when body is clicked in uncontrolled mode", async () => {
    const tasks = [buildTask(), buildTask()];
    render(<TaskList {...buildTaskListProps({ tasks })} />);

    expect(screen.queryByTestId("task-quick-actions")).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByTestId("task-item-body")[0]);

    expect(screen.getByTestId("task-quick-actions")).toBeInTheDocument();
  });

  it("should collapse previously expanded task when another is clicked in uncontrolled mode", async () => {
    const tasks = [buildTask(), buildTask()];
    render(<TaskList {...buildTaskListProps({ tasks })} />);

    await userEvent.click(screen.getAllByTestId("task-item-body")[0]);
    expect(screen.getByTestId("task-quick-actions")).toBeInTheDocument();

    await userEvent.click(screen.getAllByTestId("task-item-body")[1]);
    // Only one quick actions panel should be visible
    expect(screen.getAllByTestId("task-quick-actions")).toHaveLength(1);
  });

  it("should reset expanded state when expanded task disappears from list", async () => {
    const task1 = buildTask();
    const task2 = buildTask();

    const { rerender } = render(
      <TaskList {...buildTaskListProps({ tasks: [task1, task2] })} />,
    );

    await userEvent.click(screen.getAllByTestId("task-item-body")[0]);
    expect(screen.getByTestId("task-quick-actions")).toBeInTheDocument();

    // Remove task1 from the list
    rerender(<TaskList {...buildTaskListProps({ tasks: [task2] })} />);

    expect(screen.queryByTestId("task-quick-actions")).not.toBeInTheDocument();
  });

  it("should not reset expanded state in controlled mode when task disappears", () => {
    const task1 = buildTask();
    const task2 = buildTask();
    const onExpand = vi.fn();

    const { rerender } = render(
      <TaskList
        {...buildTaskListProps({
          tasks: [task1, task2],
          expandedTaskId: task1.id,
          onExpand,
        })}
      />,
    );

    rerender(
      <TaskList
        {...buildTaskListProps({
          tasks: [task2],
          expandedTaskId: task1.id,
          onExpand,
        })}
      />,
    );

    // In controlled mode, the parent manages the state
    expect(onExpand).not.toHaveBeenCalledWith(null);
  });
});

describe("TaskList — selected vs expanded task identity", () => {
  it("should mark only the matching task as selected in non-reorderable list", () => {
    const tasks = [buildTask(), buildTask(), buildTask()];
    render(
      <TaskList
        {...buildTaskListProps({
          tasks,
          selectedTaskId: tasks[1].id,
        })}
      />,
    );

    const taskItems = screen.getAllByTestId("task-item");
    expect(taskItems[0]).not.toHaveClass("border-l-accent");
    expect(taskItems[1]).toHaveClass("border-l-accent");
    expect(taskItems[2]).not.toHaveClass("border-l-accent");
  });

  it("should mark only the matching task as expanded in non-reorderable list", () => {
    const tasks = [buildTask(), buildTask(), buildTask()];
    const onExpand = vi.fn();
    render(
      <TaskList
        {...buildTaskListProps({
          tasks,
          expandedTaskId: tasks[2].id,
          onExpand,
        })}
      />,
    );

    const quickActions = screen.getAllByTestId("task-quick-actions");
    expect(quickActions).toHaveLength(1);
  });

  it("should mark only the matching task as selected in reorderable list", () => {
    const tasks = [buildTask(), buildTask(), buildTask()];
    render(
      <TaskList
        {...buildTaskListProps({
          tasks,
          selectedTaskId: tasks[2].id,
          onReorder: vi.fn(),
        })}
      />,
    );

    const taskItems = screen.getAllByTestId("task-item");
    expect(taskItems[0]).not.toHaveClass("border-l-accent");
    expect(taskItems[1]).not.toHaveClass("border-l-accent");
    expect(taskItems[2]).toHaveClass("border-l-accent");
  });

  it("should mark only the matching task as expanded in reorderable list", () => {
    const tasks = [buildTask(), buildTask(), buildTask()];
    const onExpand = vi.fn();
    render(
      <TaskList
        {...buildTaskListProps({
          tasks,
          expandedTaskId: tasks[0].id,
          onExpand,
          onReorder: vi.fn(),
        })}
      />,
    );

    const quickActions = screen.getAllByTestId("task-quick-actions");
    expect(quickActions).toHaveLength(1);
  });
});
