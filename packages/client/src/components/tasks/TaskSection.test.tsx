import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "@/types/entities";
import { TaskSection } from "./TaskSection";

// FR-7: mock useSectionCollapse to control collapse state
vi.mock("@/hooks/useSectionCollapse");

// FR-7: mock TaskList to avoid deep rendering
vi.mock("./TaskList", () => ({
  TaskList: (props: { tasks: Task[]; emptyMessage?: string }) => (
    <div data-testid="task-list" data-task-count={props.tasks.length}>
      {props.emptyMessage && (
        <span data-testid="empty-message">{props.emptyMessage}</span>
      )}
    </div>
  ),
}));

import { useSectionCollapse } from "@/hooks/useSectionCollapse";

const MOCK_TASK: Task = {
  id: "task-1",
  name: "Test task",
  box: "today",
  is_completed: false,
  is_deleted: false,
  version: 1,
  sort_order: "0",
  description: "",
  goal_id: "",
  context_id: "",
  category_id: "",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  completed_at: "",
  next_date: "",
  appear_date: "",
  repeat_rule: "",
  checklist: [],
  needsSync: false,
} as unknown as Task;

function createMockTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, index) => ({
    ...MOCK_TASK,
    id: `task-${index + 1}`,
    name: `Task ${index + 1}`,
  }));
}

const DEFAULT_PROPS = {
  sectionKey: "today",
  label: "Today",
  tasks: [] as Task[],
  goals: [],
  contexts: [],
  categories: [],
  onComplete: vi.fn(),
  onUpdate: vi.fn(),
  onMove: vi.fn(),
  onDelete: vi.fn(),
};

describe("TaskSection", () => {
  const mockToggleCollapse = vi.fn();

  function setupCollapseMock(isCollapsed = false) {
    vi.mocked(useSectionCollapse).mockReturnValue({
      isCollapsed,
      toggleCollapse: mockToggleCollapse,
    });
  }

  // FR-7: Section renders with label and count
  it("should display label and task count in header", () => {
    setupCollapseMock();
    const tasks = createMockTasks(3);
    render(<TaskSection {...DEFAULT_PROPS} label="Today" tasks={tasks} />);

    expect(screen.getByText("Today (3)")).toBeInTheDocument();
  });

  // FR-7: Section uses correct sectionKey for collapse persistence
  it("should pass sectionKey to useSectionCollapse", () => {
    setupCollapseMock();
    render(<TaskSection {...DEFAULT_PROPS} sectionKey="my-section" />);

    expect(useSectionCollapse).toHaveBeenCalledWith("my-section");
  });

  // FR-7: Section is collapsible — expanded state shows TaskList
  it("should render TaskList when expanded", () => {
    setupCollapseMock(false);
    const tasks = createMockTasks(2);
    render(<TaskSection {...DEFAULT_PROPS} tasks={tasks} />);

    expect(screen.getByTestId("task-list")).toBeInTheDocument();
  });

  // FR-7: Section is collapsible — collapsed state hides TaskList
  it("should hide TaskList when collapsed", () => {
    setupCollapseMock(true);
    const tasks = createMockTasks(2);
    render(<TaskSection {...DEFAULT_PROPS} tasks={tasks} />);

    expect(screen.queryByTestId("task-list")).not.toBeInTheDocument();
  });

  // FR-7: Clicking header toggles collapse
  it("should call toggleCollapse when header is clicked", () => {
    setupCollapseMock();
    render(<TaskSection {...DEFAULT_PROPS} />);

    const headerButton = screen.getByRole("button");
    fireEvent.click(headerButton);

    expect(mockToggleCollapse).toHaveBeenCalledOnce();
  });

  // FR-7: ChevronDown rotates when collapsed
  it("should rotate chevron icon when collapsed", () => {
    setupCollapseMock(true);
    render(<TaskSection {...DEFAULT_PROPS} />);

    const chevron = screen.getByRole("button").querySelector("svg");
    expect(chevron?.getAttribute("class")).toContain("-rotate-90");
  });

  // FR-7: ChevronDown not rotated when expanded
  it("should not rotate chevron icon when expanded", () => {
    setupCollapseMock(false);
    render(<TaskSection {...DEFAULT_PROPS} />);

    const chevron = screen.getByRole("button").querySelector("svg");
    const chevronClass = chevron?.getAttribute("class") ?? "";
    expect(chevronClass).not.toContain("-rotate-90");
    expect(chevronClass).toMatch(
      /w-4 h-4 transition-transform duration-200\s*$/,
    );
  });

  // FR-7: Empty section with message
  it("should show TaskList with emptyMessage when 0 tasks and emptyMessage provided", () => {
    setupCollapseMock(false);
    render(
      <TaskSection
        {...DEFAULT_PROPS}
        tasks={[]}
        emptyMessage="No tasks here"
      />,
    );

    expect(screen.getByTestId("task-list")).toBeInTheDocument();
    expect(screen.getByTestId("empty-message")).toHaveTextContent(
      "No tasks here",
    );
  });

  // FR-7: Empty section hidden when hideEmptyState is true
  it("should not render TaskList when 0 tasks and hideEmptyState is true", () => {
    setupCollapseMock(false);
    render(<TaskSection {...DEFAULT_PROPS} tasks={[]} hideEmptyState />);

    expect(screen.queryByTestId("task-list")).not.toBeInTheDocument();
  });

  // FR-7: hideEmptyState does not hide section when tasks exist
  it("should render TaskList when tasks exist even with hideEmptyState", () => {
    setupCollapseMock(false);
    const tasks = createMockTasks(1);
    render(<TaskSection {...DEFAULT_PROPS} tasks={tasks} hideEmptyState />);

    expect(screen.getByTestId("task-list")).toBeInTheDocument();
  });

  // FR-7: Header is always visible even when collapsed
  it("should always show header regardless of collapse state", () => {
    setupCollapseMock(true);
    const tasks = createMockTasks(3);
    render(<TaskSection {...DEFAULT_PROPS} label="Week" tasks={tasks} />);

    expect(screen.getByText("Week (3)")).toBeInTheDocument();
  });
});
