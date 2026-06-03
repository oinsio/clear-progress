/**
 * Tests for InboxPage — inbox-only task page.
 * Implements FR1 of refactor-task-pages
 * Implements FR20 of command-bar
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockCompleteTask = vi.fn();
const mockDeleteTask = vi.fn();
const mockCreateTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockMoveTask = vi.fn();
const mockReorderTasks = vi.fn();
const mockDuplicateTask = vi.fn().mockResolvedValue({ id: "dup-1" } as Task);

vi.mock("@/hooks/useTasks", () => ({
  useTasks: vi.fn(() => ({
    tasks: [],
    isLoading: false,
    completeTask: mockCompleteTask,
    deleteTask: mockDeleteTask,
    createTask: mockCreateTask,
    updateTask: mockUpdateTask,
    moveTask: mockMoveTask,
    reorderTasks: mockReorderTasks,
    duplicateTask: mockDuplicateTask,
    reload: vi.fn(),
  })),
}));

vi.mock("@/hooks/useGoals", () => ({
  useGoals: () => ({ goals: [], isLoading: false }),
}));
vi.mock("@/hooks/useContexts", () => ({
  useContexts: () => ({ contexts: [], isLoading: false }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ categories: [], isLoading: false }),
}));
vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: () => ({ isFocusMode: false, focusOpacity: 1 }),
}));

vi.mock("@/hooks/useShowHidden", () => ({
  useShowHidden: () => ({
    showHidden: false,
    toggleShowHidden: vi.fn(),
  }),
}));

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: "bottom",
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({
    handedness: "right",
    setHandedness: vi.fn(),
  }),
}));

const mockSetSelectedTaskId = vi.fn();
vi.mock("@/hooks/useTaskSelection", () => ({
  useTaskSelection: () => ({
    selectedTaskId: null,
    expandedTaskId: null,
    selectedTask: null,
    setSelectedTaskId: mockSetSelectedTaskId,
    setExpandedTaskId: vi.fn(),
    handleTaskSelect: vi.fn(),
    handleTaskExpand: vi.fn(),
    handleDetailPanelClose: vi.fn(),
  }),
}));

const mockHandleComplete = vi.fn();
vi.mock("@/hooks/useTaskCompletion", () => ({
  useTaskCompletion: () => mockHandleComplete,
}));

vi.mock("@/components/tasks/TaskPageLayout", () => ({
  TaskPageLayout: ({
    children,
    sidebarMode,
  }: {
    children: React.ReactNode;
    sidebarMode: string;
  }) => (
    <div data-testid="task-page-layout" data-sidebar-mode={sidebarMode}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/tasks/TaskSection", () => ({
  TaskSection: ({
    tasks,
    label,
    onComplete,
  }: {
    tasks: Task[];
    label: string;
    onComplete: (id: string) => void;
  }) => (
    <div data-testid="task-section" data-label={label}>
      {tasks.map((task) => (
        <div key={task.id} data-testid="task-item" data-task-id={task.id}>
          {task.name}
          <button
            data-testid={`complete-${task.id}`}
            onClick={() => onComplete(task.id)}
          />
        </div>
      ))}
    </div>
  ),
}));

import { useTasks } from "@/hooks/useTasks";

const mockUseTasks = vi.mocked(useTasks);

function renderPage() {
  return render(<InboxPage />);
}

import type React from "react";
import InboxPage from "./InboxPage";

describe("InboxPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // FR-1: renders page container with correct testid
  it("should render the page container", () => {
    renderPage();
    expect(screen.getByTestId("inbox-page")).toBeInTheDocument();
  });

  // FR-1: passes sidebarMode="inbox" to TaskPageLayout
  it("should render TaskPageLayout with sidebarMode inbox", () => {
    renderPage();
    const layout = screen.getByTestId("task-page-layout");
    expect(layout).toHaveAttribute("data-sidebar-mode", "inbox");
  });

  // FR-1: calls useTasks with BOX.INBOX
  it("should call useTasks with inbox box", () => {
    renderPage();
    expect(mockUseTasks).toHaveBeenCalledWith(BOX.INBOX);
  });

  // FR-1: renders TaskSection with inbox tasks
  it("should render TaskSection with inbox label", () => {
    renderPage();
    const section = screen.getByTestId("task-section");
    expect(section).toHaveAttribute("data-label", "section.inbox");
  });

  // FR-20: renders CommandBar
  it("should render CommandBar", () => {
    renderPage();
    expect(screen.getByTestId("command-bar")).toBeInTheDocument();
  });

  // FR-20: CommandBar has no filter (no filter toggle)
  it("should not render CommandBar filter toggle", () => {
    renderPage();
    expect(
      screen.queryByTestId("command-bar-filter-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has eye toggle
  it("should render CommandBar eye toggle", () => {
    renderPage();
    expect(screen.getByTestId("command-bar-eye-toggle")).toBeInTheDocument();
  });

  // FR-20: CommandBar has to create button
  it("should render CommandBar create button", () => {
    renderPage();
    expect(screen.getByTestId("command-bar-create-button")).toBeInTheDocument();
  });

  // FR-1: filters out completed tasks
  it("should filter out completed tasks", () => {
    const tasks = [
      buildTask({ name: "Active", is_completed: false }),
      buildTask({ name: "Done", is_completed: true }),
    ];
    mockUseTasks.mockReturnValue({
      tasks,
      isLoading: false,
      completeTask: mockCompleteTask,
      deleteTask: mockDeleteTask,
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      moveTask: mockMoveTask,
      reorderTasks: mockReorderTasks,
      duplicateTask: mockDuplicateTask,
      reload: vi.fn(),
    });
    renderPage();
    const items = screen.getAllByTestId("task-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Active");
  });

  // FR-20: creates task via CommandBar submit
  it("should call createTask when submitting via CommandBar", async () => {
    renderPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "New task" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith("New task");
    });
  });

  // FR-1: handles task completion via onComplete
  it("should call completion handler when task is completed", () => {
    const task = buildTask({ name: "Test task", is_completed: false });
    mockUseTasks.mockReturnValue({
      tasks: [task],
      isLoading: false,
      completeTask: mockCompleteTask,
      deleteTask: mockDeleteTask,
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      moveTask: mockMoveTask,
      reorderTasks: mockReorderTasks,
      duplicateTask: mockDuplicateTask,
      reload: vi.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByTestId(`complete-${task.id}`));
    expect(mockHandleComplete).toHaveBeenCalledWith(task.id);
  });
});
