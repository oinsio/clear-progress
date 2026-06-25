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

function renderTaskList(overrides: Partial<TaskListProps> = {}) {
  return render(<TaskList {...buildTaskListProps(overrides)} />);
}

describe("TaskList — empty state", () => {
  it("should render clickable empty state when onEmptyClick is provided", async () => {
    const onEmptyClick = vi.fn();
    renderTaskList({ onEmptyClick });
    const emptyElement = screen.getByTestId("task-list-empty");
    expect(emptyElement.tagName).toBe("BUTTON");
    await userEvent.click(emptyElement);
    expect(onEmptyClick).toHaveBeenCalledOnce();
  });

  it("should render non-clickable empty state when onEmptyClick is not provided", () => {
    renderTaskList();
    const emptyElement = screen.getByTestId("task-list-empty");
    expect(emptyElement.tagName).toBe("DIV");
  });

  it("should display custom empty message when provided", () => {
    const customMessage = "Custom empty text";
    renderTaskList({ emptyMessage: customMessage });
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("should apply compact padding when emptyMessage is provided", () => {
    renderTaskList({ emptyMessage: "Short message" });
    const emptyElement = screen.getByTestId("task-list-empty");
    expect(emptyElement.className).toContain("py-3");
    expect(emptyElement.className).not.toContain("py-16");
  });

  it("should apply large padding when emptyMessage is not provided", () => {
    renderTaskList();
    const emptyElement = screen.getByTestId("task-list-empty");
    expect(emptyElement.className).toContain("py-16");
    expect(emptyElement.className).not.toContain("py-3");
  });

  it("should apply compact padding on clickable empty state when emptyMessage is provided", () => {
    renderTaskList({ emptyMessage: "Short msg", onEmptyClick: vi.fn() });
    const emptyElement = screen.getByTestId("task-list-empty");
    expect(emptyElement.className).toContain("py-3");
  });

  it("should apply large padding on clickable empty state when emptyMessage is not provided", () => {
    renderTaskList({ onEmptyClick: vi.fn() });
    const emptyElement = screen.getByTestId("task-list-empty");
    expect(emptyElement.className).toContain("py-16");
  });
});

describe("TaskList — non-reorderable list", () => {
  it("should render task list as ul element when onReorder is not provided", () => {
    const tasks = [buildTask()];
    renderTaskList({ tasks });
    expect(screen.getByTestId("task-list").tagName).toBe("UL");
  });

  it("should wrap each task in a swipeable container", () => {
    const tasks = [buildTask(), buildTask()];
    renderTaskList({ tasks });
    const swipeableContainers = screen.getAllByTestId("swipeable-container");
    expect(swipeableContainers).toHaveLength(2);
  });

  it("should pass isSelected=true only for the selected task", () => {
    const tasks = [buildTask(), buildTask()];
    renderTaskList({ tasks, selectedTaskId: tasks[0].id });
    const taskItems = screen.getAllByTestId("task-item");
    expect(taskItems[0]).toHaveClass("border-l-accent");
  });

  it("should pass isExpanded to matching task in non-reorderable list", () => {
    const tasks = [buildTask()];
    const onExpand = vi.fn();
    renderTaskList({ tasks, expandedTaskId: tasks[0].id, onExpand });
    expect(screen.getByTestId("task-quick-actions")).toBeInTheDocument();
  });
});

describe("TaskList — reorderable list", () => {
  it("should render task list with drag handles when onReorder is provided", () => {
    const tasks = [buildTask(), buildTask()];
    renderTaskList({ tasks, onReorder: vi.fn() });
    expect(screen.getByTestId("task-list")).toBeInTheDocument();
  });

  it("should pass isSelected to matching task in reorderable list", () => {
    const tasks = [buildTask(), buildTask()];
    renderTaskList({
      tasks,
      onReorder: vi.fn(),
      selectedTaskId: tasks[1].id,
    });
    const taskItems = screen.getAllByTestId("task-item");
    expect(taskItems[1]).toHaveClass("border-l-accent");
  });

  it("should pass isExpanded to matching task in reorderable list", () => {
    const tasks = [buildTask()];
    const onExpand = vi.fn();
    renderTaskList({
      tasks,
      onReorder: vi.fn(),
      expandedTaskId: tasks[0].id,
      onExpand,
    });
    expect(screen.getByTestId("task-quick-actions")).toBeInTheDocument();
  });
});
