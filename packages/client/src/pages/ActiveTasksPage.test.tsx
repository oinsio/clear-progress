import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCategoriesHook,
  buildCompletedTasksHook,
  buildContextsHook,
  buildGoalsHook,
  buildTasksHook,
} from "@/test/builders/hookBuilders";
import { buildTask } from "@/test/factories/taskFactory";

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({
    accessToken: null,
    userEmail: null,
    userPicture: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  }),
}));
vi.mock("@/hooks/useTasks");
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useContexts");
vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/useCompletedTasks");
vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: () => ({
    isFocusMode: false,
    setFocusMode: vi.fn(),
    focusOpacity: 30,
    setFocusOpacity: vi.fn(),
  }),
}));

vi.mock("@/hooks/useShowHidden", () => ({
  useShowHidden: () => ({
    showHidden: false,
    toggleShowHidden: vi.fn(),
  }),
}));

let mockFilterBarPosition = "bottom";
vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: mockFilterBarPosition,
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    defaultBox: "today",
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn(),
    setAccentColor: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({
    handedness: "right",
    setHandedness: vi.fn(),
  }),
}));

import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";
import { useTasks } from "@/hooks/useTasks";
import ActiveTasksPage from "./ActiveTasksPage";

const mockUseTasks = vi.mocked(useTasks);
const mockUseGoals = vi.mocked(useGoals);
const mockUseContexts = vi.mocked(useContexts);
const mockUseCategories = vi.mocked(useCategories);
const mockUseCompletedTasks = vi.mocked(useCompletedTasks);

function renderPage() {
  return render(
    <MemoryRouter>
      <ActiveTasksPage />
    </MemoryRouter>,
  );
}

function setupAllBoxTasks() {
  const todayTasks = [buildTask({ box: "today" })];
  const weekTasks = [buildTask({ box: "week" })];
  const laterTasks = [buildTask({ box: "later" })];
  mockUseTasks.mockImplementation((box) => {
    if (box === "today") return buildTasksHook({ tasks: todayTasks });
    if (box === "week") return buildTasksHook({ tasks: weekTasks });
    if (box === "later") return buildTasksHook({ tasks: laterTasks });
    return buildTasksHook();
  });
}

describe("ActiveTasksPage", () => {
  beforeEach(() => {
    mockFilterBarPosition = "bottom";
    mockUseTasks.mockReturnValue(buildTasksHook());
    mockUseGoals.mockReturnValue(buildGoalsHook());
    mockUseContexts.mockReturnValue(buildContextsHook());
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    mockUseCompletedTasks.mockReturnValue(buildCompletedTasksHook());
  });

  // FR-2: renders root container with correct data-testid
  it("should render the page container", () => {
    renderPage();
    expect(screen.getByTestId("active-tasks-page")).toBeInTheDocument();
  });

  // FR-2: shows TaskPageLayout with sidebarMode="tasks"
  it("should render TaskPageLayout", () => {
    renderPage();
    expect(screen.getByTestId("task-page-layout")).toBeInTheDocument();
  });

  // FR-20: shows CommandBar instead of BoxFilterBar
  it("should render CommandBar", () => {
    renderPage();
    expect(screen.getByTestId("command-bar")).toBeInTheDocument();
  });

  // FR-20: CommandBar has filter toggle
  it("should render CommandBar filter toggle", () => {
    renderPage();
    expect(screen.getByTestId("command-bar-filter-toggle")).toBeInTheDocument();
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

  // FR-20: CommandBar has entity icon
  it("should render CommandBar entity icon", () => {
    renderPage();
    expect(screen.getByTestId("command-bar-entity-icon")).toBeInTheDocument();
  });

  // FR-2: shows three sections (today, week, later) when filter is "all"
  it("should show today/week/later sections in all-box view", () => {
    setupAllBoxTasks();
    renderPage();
    // Should have 3 task items (one per section)
    expect(screen.getAllByTestId("task-item")).toHaveLength(3);
  });

  // FR-2: shows completed today section when there are completed tasks
  it("should show completed today section when completed tasks exist", () => {
    const todayTimestamp = new Date().toISOString();
    const completedTasks = [
      buildTask({
        name: "Done task",
        is_completed: true,
        completed_at: todayTimestamp,
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.getByText(/Done task/)).toBeInTheDocument();
  });

  // FR-2: does not show completed section when no completed tasks
  it("should not show completed today section when no completed tasks", () => {
    renderPage();
    // Only 3 sections: today, week, later (week and later hidden when empty)
    // At minimum, the today section empty state should be visible
    const emptySections = screen.queryAllByTestId("task-list-empty");
    expect(emptySections.length).toBeGreaterThan(0);
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
    // Expand filter bar and select "today"
    fireEvent.click(screen.getByTestId("command-bar-filter-toggle"));
    fireEvent.click(screen.getByTestId("box-filter-today"));
    // Only today tasks should show (in a TaskList, not sections)
    expect(screen.getAllByTestId("task-item")).toHaveLength(1);
  });

  // FR-2: completed tasks from yesterday should not appear in completed today section
  it("should not show yesterday completed tasks in completed today section", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const completedTasks = [
      buildTask({
        name: "Old task",
        is_completed: true,
        completed_at: yesterday.toISOString(),
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.queryByText(/Old task/)).not.toBeInTheDocument();
  });

  // FR-2: tasks without completed_at should not appear in completed today section
  it("should not show tasks without completed_at in completed today section", () => {
    const completedTasks = [
      buildTask({
        name: "No date task",
        is_completed: true,
        completed_at: "",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.queryByText(/No date task/)).not.toBeInTheDocument();
  });

  // FR-2: filters out already completed tasks from active sections
  it("should filter out is_completed tasks from today section", () => {
    const todayTasks = [
      buildTask({ box: "today", name: "Active task" }),
      buildTask({ box: "today", name: "Completed task", is_completed: true }),
    ];
    mockUseTasks.mockImplementation((box) => {
      if (box === "today") return buildTasksHook({ tasks: todayTasks });
      return buildTasksHook();
    });
    renderPage();
    expect(screen.getByText(/Active task/)).toBeInTheDocument();
    expect(screen.queryByText(/Completed task/)).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByTestId("command-bar-filter-toggle"));
    fireEvent.click(screen.getByTestId("box-filter-week"));
    expect(screen.getByText(/Active week/)).toBeInTheDocument();
    expect(screen.queryByText(/Done week/)).not.toBeInTheDocument();
  });

  // FR-2: section labels are rendered with correct translated text
  it("should render section labels for today, week, later", () => {
    setupAllBoxTasks();
    renderPage();
    expect(screen.getByText(/Сегодня/)).toBeInTheDocument();
    expect(screen.getByText(/Неделя/)).toBeInTheDocument();
    expect(screen.getByText(/Позже/)).toBeInTheDocument();
  });

  // FR-2: completed today section label is correct
  it("should render completed today section with correct label", () => {
    const todayTimestamp = new Date().toISOString();
    const completedTasks = [
      buildTask({ is_completed: true, completed_at: todayTimestamp }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();
    expect(screen.getByText(/Выполненные сегодня/)).toBeInTheDocument();
  });

  // FR-2: empty message for today section uses correct translated text
  it("should render today empty message with correct translated text", () => {
    renderPage();
    expect(screen.getByText(/Задач на сегодня нет/)).toBeInTheDocument();
  });

  // FR-2: shows week tasks in single box view
  it("should show week tasks when week filter is selected", () => {
    const weekTasks = [buildTask({ box: "week", name: "Week task" })];
    mockUseTasks.mockImplementation((box) => {
      if (box === "week") return buildTasksHook({ tasks: weekTasks });
      return buildTasksHook();
    });
    renderPage();
    fireEvent.click(screen.getByTestId("command-bar-filter-toggle"));
    fireEvent.click(screen.getByTestId("box-filter-week"));
    expect(screen.getByText(/Week task/)).toBeInTheDocument();
  });

  // FR-2: shows later tasks in single box view
  it("should show later tasks when later filter is selected", () => {
    const laterTasks = [buildTask({ box: "later", name: "Later task" })];
    mockUseTasks.mockImplementation((box) => {
      if (box === "later") return buildTasksHook({ tasks: laterTasks });
      return buildTasksHook();
    });
    renderPage();
    fireEvent.click(screen.getByTestId("command-bar-filter-toggle"));
    fireEvent.click(screen.getByTestId("box-filter-later"));
    expect(screen.getByText(/Later task/)).toBeInTheDocument();
  });

  // FR-2: filters out completed tasks from week section in all-box view
  it("should filter out is_completed tasks from week section", () => {
    const weekTasks = [
      buildTask({ box: "week", name: "Active week task" }),
      buildTask({
        box: "week",
        name: "Completed week task",
        is_completed: true,
      }),
    ];
    mockUseTasks.mockImplementation((box) => {
      if (box === "week") return buildTasksHook({ tasks: weekTasks });
      return buildTasksHook();
    });
    renderPage();
    expect(screen.getByText(/Active week task/)).toBeInTheDocument();
    expect(screen.queryByText(/Completed week task/)).not.toBeInTheDocument();
  });

  // FR-2: filters out completed tasks from later section in all-box view
  it("should filter out is_completed tasks from later section", () => {
    const laterTasks = [
      buildTask({ box: "later", name: "Active later task" }),
      buildTask({
        box: "later",
        name: "Completed later task",
        is_completed: true,
      }),
    ];
    mockUseTasks.mockImplementation((box) => {
      if (box === "later") return buildTasksHook({ tasks: laterTasks });
      return buildTasksHook();
    });
    renderPage();
    expect(screen.getByText(/Active later task/)).toBeInTheDocument();
    expect(screen.queryByText(/Completed later task/)).not.toBeInTheDocument();
  });

  // FR-20: creates task via CommandBar submit in all-box view using default box
  it("should create task via CommandBar in all-box view", async () => {
    const createTodayTask = vi.fn().mockResolvedValue(undefined);
    const createWeekTask = vi.fn().mockResolvedValue(undefined);
    mockUseTasks.mockImplementation((box) => {
      if (box === "today")
        return buildTasksHook({ createTask: createTodayTask });
      if (box === "week") return buildTasksHook({ createTask: createWeekTask });
      return buildTasksHook();
    });
    renderPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "All box task" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createTodayTask).toHaveBeenCalledWith("All box task");
    });
    expect(createWeekTask).not.toHaveBeenCalled();
  });

  // FR-20: creates task in selected box via CommandBar
  it("should create task in week box when week filter is active", async () => {
    const createWeekTask = vi.fn().mockResolvedValue(undefined);
    mockUseTasks.mockImplementation((box) => {
      if (box === "week") return buildTasksHook({ createTask: createWeekTask });
      return buildTasksHook();
    });
    renderPage();
    fireEvent.click(screen.getByTestId("command-bar-filter-toggle"));
    fireEvent.click(screen.getByTestId("box-filter-week"));
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "Week task" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createWeekTask).toHaveBeenCalledWith("Week task");
    });
  });

  // FR-2: completed today section is not visible when there are zero completed tasks
  it("should not render completed today section when todayCompletedTasks is empty", () => {
    // Ensure no completed tasks at all
    mockUseCompletedTasks.mockReturnValue(buildCompletedTasksHook());
    renderPage();
    // Should not see the completed today section label
    expect(screen.queryByText(/Выполненные сегодня/)).not.toBeInTheDocument();
  });

  // FR-7: CompletedPage should NOT have CommandBar (verified in CompletedPage.test.tsx)
});
