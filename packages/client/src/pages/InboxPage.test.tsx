/**
 * Tests for InboxPage — inbox-only task page.
 * Implements FR1 of refactor-task-pages
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

let mockFilterBarPosition = "bottom";
vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: mockFilterBarPosition,
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/components/tasks/TaskPageLayout", () => ({
  TaskPageLayout: ({
    children,
    sidebarMode,
    topToolbar,
    bottomToolbar,
  }: {
    children: React.ReactNode;
    sidebarMode: string;
    topToolbar?: React.ReactNode;
    bottomToolbar?: React.ReactNode;
  }) => (
    <div data-testid="task-page-layout" data-sidebar-mode={sidebarMode}>
      {topToolbar && <div data-testid="top-toolbar">{topToolbar}</div>}
      {children}
      {bottomToolbar && <div data-testid="bottom-toolbar">{bottomToolbar}</div>}
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

vi.mock("@/components/tasks/AddTaskInput", () => ({
  AddTaskInput: ({
    onAdd,
    onCancel,
  }: {
    onAdd: (name: string) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="add-task-input">
      <button data-testid="submit-add" onClick={() => onAdd("New task")} />
      <button data-testid="cancel-add" onClick={onCancel} />
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
    mockFilterBarPosition = "bottom";
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

  // FR-1: shows AddTaskInput when add button clicked
  it("should show AddTaskInput when add button is clicked", () => {
    renderPage();
    expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("add-task-button"));
    expect(screen.getByTestId("add-task-input")).toBeInTheDocument();
  });

  // FR-1: hides AddTaskInput after submit
  it("should hide AddTaskInput after task is submitted", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    fireEvent.click(screen.getByTestId("submit-add"));
    await waitFor(() => {
      expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
    });
  });

  // FR-1: hides AddTaskInput on cancel
  it("should hide AddTaskInput on cancel", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    fireEvent.click(screen.getByTestId("cancel-add"));
    expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
  });

  // FR-1: add button in bottom toolbar when filterBarPosition is bottom
  it("should render add button in bottom toolbar when position is bottom", () => {
    mockFilterBarPosition = "bottom";
    renderPage();
    const bottomToolbar = screen.getByTestId("bottom-toolbar");
    expect(
      bottomToolbar.querySelector("[data-testid='add-task-button']"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("top-toolbar")).not.toBeInTheDocument();
  });

  // FR-1: add button in top toolbar when filterBarPosition is top
  it("should render add button in top toolbar when position is top", () => {
    mockFilterBarPosition = "top";
    renderPage();
    const topToolbar = screen.getByTestId("top-toolbar");
    expect(
      topToolbar.querySelector("[data-testid='add-task-button']"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("bottom-toolbar")).not.toBeInTheDocument();
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
