import { render, screen } from "@testing-library/react";
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

describe("TaskList — drag and drop reorder", () => {
  it("should render drag handles for each task when onReorder is provided", () => {
    const tasks = [buildTask(), buildTask()];
    render(<TaskList {...buildTaskListProps({ tasks, onReorder: vi.fn() })} />);
    const dragHandles = screen.getAllByRole("button", { name: /перетащить/i });
    expect(dragHandles).toHaveLength(2);
  });

  it("should not render drag handles when onReorder is not provided", () => {
    const tasks = [buildTask(), buildTask()];
    render(<TaskList {...buildTaskListProps({ tasks })} />);
    expect(
      screen.queryByRole("button", { name: /перетащить/i }),
    ).not.toBeInTheDocument();
  });

  it("should render non-reorderable list path when onReorder is falsy", () => {
    const tasks = [buildTask()];
    render(<TaskList {...buildTaskListProps({ tasks })} />);
    // Non-reorderable list wraps items in SwipeableItem only (no SortableItem)
    expect(screen.getByTestId("task-list")).toBeInTheDocument();
    expect(screen.getAllByTestId("swipeable-container")).toHaveLength(1);
  });
});

describe("TaskList — isControlled logic", () => {
  it("should use controlled expandedTaskId when provided", () => {
    const tasks = [buildTask()];
    const onExpand = vi.fn();
    render(
      <TaskList
        {...buildTaskListProps({
          tasks,
          expandedTaskId: tasks[0].id,
          onExpand,
        })}
      />,
    );
    // Quick actions should be visible for expanded task
    expect(screen.getByTestId("task-quick-actions")).toBeInTheDocument();
  });

  it("should not show quick actions when controlledExpandedTaskId does not match any task", () => {
    const tasks = [buildTask()];
    const onExpand = vi.fn();
    render(
      <TaskList
        {...buildTaskListProps({
          tasks,
          expandedTaskId: "non-existent-id",
          onExpand,
        })}
      />,
    );
    expect(screen.queryByTestId("task-quick-actions")).not.toBeInTheDocument();
  });

  it("should use setExpandedTaskId from controlledOnExpand when provided", () => {
    const tasks = [buildTask()];
    const onExpand = vi.fn();
    render(
      <TaskList
        {...buildTaskListProps({
          tasks,
          expandedTaskId: null,
          onExpand,
        })}
      />,
    );
    // The component should use onExpand, not setLocalExpandedTaskId
    expect(onExpand).not.toHaveBeenCalled();
  });
});

describe("TaskList — empty message fallback", () => {
  it("should display default translated text when emptyMessage is not provided", () => {
    render(<TaskList {...buildTaskListProps()} />);
    // Default message from i18n: "Нет задач"
    expect(screen.getByText("Нет задач")).toBeInTheDocument();
  });

  it("should display custom emptyMessage instead of default when provided", () => {
    render(
      <TaskList {...buildTaskListProps({ emptyMessage: "Nothing here" })} />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByText("Нет задач")).not.toBeInTheDocument();
  });

  it("should display custom emptyMessage in clickable empty state", () => {
    render(
      <TaskList
        {...buildTaskListProps({
          emptyMessage: "Click to add",
          onEmptyClick: vi.fn(),
        })}
      />,
    );
    expect(screen.getByText("Click to add")).toBeInTheDocument();
    expect(screen.queryByText("Нет задач")).not.toBeInTheDocument();
  });

  it("should display default text in clickable empty state when emptyMessage is not provided", () => {
    render(<TaskList {...buildTaskListProps({ onEmptyClick: vi.fn() })} />);
    expect(screen.getByText("Нет задач")).toBeInTheDocument();
  });
});
