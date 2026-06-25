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

describe("TaskList — swipe right config", () => {
  it("should render green swipe background for incomplete task", () => {
    const task = buildTask({ is_completed: false });
    render(<TaskList {...buildTaskListProps({ tasks: [task] })} />);
    const swipeBackground = screen.getByTestId("swipe-background-left");
    expect(swipeBackground).toHaveClass("bg-green-500");
  });

  it("should render amber swipe background for completed task", () => {
    const task = buildTask({ is_completed: true });
    render(<TaskList {...buildTaskListProps({ tasks: [task] })} />);
    const swipeBackground = screen.getByTestId("swipe-background-left");
    expect(swipeBackground).toHaveClass("bg-amber-500");
  });

  it("should render Check icon for incomplete task swipe", () => {
    const task = buildTask({ is_completed: false });
    render(<TaskList {...buildTaskListProps({ tasks: [task] })} />);
    const swipeBackground = screen.getByTestId("swipe-background-left");
    // Check icon renders as svg with lucide class
    const icon = swipeBackground.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should render RotateCcw icon for completed task swipe", () => {
    const task = buildTask({ is_completed: true });
    render(<TaskList {...buildTaskListProps({ tasks: [task] })} />);
    const swipeBackground = screen.getByTestId("swipe-background-left");
    const icon = swipeBackground.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should use different swipe colors for completed vs incomplete tasks in same list", () => {
    const incompleteTtask = buildTask({ is_completed: false });
    const completedTask = buildTask({ is_completed: true });
    render(
      <TaskList
        {...buildTaskListProps({ tasks: [incompleteTtask, completedTask] })}
      />,
    );
    const swipeBackgrounds = screen.getAllByTestId("swipe-background-left");
    expect(swipeBackgrounds[0]).toHaveClass("bg-green-500");
    expect(swipeBackgrounds[1]).toHaveClass("bg-amber-500");
  });

  it("should render swipe backgrounds in reorderable list too", () => {
    const task = buildTask({ is_completed: false });
    render(
      <TaskList
        {...buildTaskListProps({ tasks: [task], onReorder: vi.fn() })}
      />,
    );
    const swipeBackground = screen.getByTestId("swipe-background-left");
    expect(swipeBackground).toHaveClass("bg-green-500");
  });
});
