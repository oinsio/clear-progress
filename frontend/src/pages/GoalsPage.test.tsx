import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import GoalsPage from "./GoalsPage";
import { buildGoal } from "@/test/factories/goalFactory";
import type { UseGoalsReturn } from "@/hooks/useGoals";

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ accessToken: null, userEmail: null, userPicture: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn() }),
}));
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/useTasks");
vi.mock("@/services/TaskService", () => ({
  TaskService: vi.fn().mockImplementation(() => ({
    getGoalTaskCounts: vi.fn().mockResolvedValue({}),
  })),
}));
vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn().mockImplementation(() => ({})),
}));

import { useGoals } from "@/hooks/useGoals";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useTasks } from "@/hooks/useTasks";
import type { UseTasksReturn } from "@/hooks/useTasks";

const mockUseGoals = vi.mocked(useGoals);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUseTasks = vi.mocked(useTasks);

function buildGoalsHook(overrides: Partial<UseGoalsReturn> = {}): UseGoalsReturn {
  return {
    goals: [],
    isLoading: false,
    reloadGoals: vi.fn().mockResolvedValue(undefined),
    reorderGoals: vi.fn().mockResolvedValue(undefined),
    createGoal: vi.fn<UseGoalsReturn["createGoal"]>().mockResolvedValue(undefined),
    updateGoal: vi.fn().mockResolvedValue(undefined),
    updateGoalStatus: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildTasksHook(overrides: Partial<UseTasksReturn> = {}): UseTasksReturn {
  return {
    tasks: [],
    isLoading: false,
    createTask: vi.fn().mockResolvedValue(undefined),
    completeTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    moveTask: vi.fn().mockResolvedValue(undefined),
    reorderTasks: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderGoalsPage() {
  mockUsePanelSide.mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() });
  mockUsePanelOpen.mockReturnValue({ isPanelOpen: false, togglePanelOpen: vi.fn() });
  mockUseTasks.mockReturnValue(buildTasksHook());

  render(
    <MemoryRouter>
      <GoalsPage />
    </MemoryRouter>,
  );
}

describe("GoalsPage", () => {
  it("should render page with test-id 'goals-page'", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.getByTestId("goals-page")).toBeInTheDocument();
  });

  it("should render header 'Мои цели'", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.getByText("Мои цели")).toBeInTheDocument();
  });

  it("should render goal items for each active goal", () => {
    const goals = [buildGoal({ title: "Goal A" }), buildGoal({ title: "Goal B" })];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));
    renderGoalsPage();
    expect(screen.getByText("Goal A")).toBeInTheDocument();
    expect(screen.getByText("Goal B")).toBeInTheDocument();
  });

  it("should not render deleted goals", () => {
    const goals = [
      buildGoal({ title: "Active Goal" }),
      buildGoal({ title: "Deleted Goal", is_deleted: true }),
    ];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));
    renderGoalsPage();
    expect(screen.getByText("Active Goal")).toBeInTheDocument();
    expect(screen.queryByText("Deleted Goal")).not.toBeInTheDocument();
  });

  it("should show empty state when no goals exist", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [] }));
    renderGoalsPage();
    expect(screen.getByTestId("empty-goals-message")).toBeInTheDocument();
  });

  it("should not show empty state when goals exist", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [buildGoal()] }));
    renderGoalsPage();
    expect(screen.queryByTestId("empty-goals-message")).not.toBeInTheDocument();
  });

  it("should render add goal button", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.getByTestId("add-goal-button")).toBeInTheDocument();
  });

  it("should render add task button", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });

  it("should show inline goal input when add goal button is clicked", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    fireEvent.click(screen.getByTestId("add-goal-button"));
    expect(screen.getByTestId("add-goal-input")).toBeInTheDocument();
  });

  it("should call createGoal with title when Enter is pressed in inline goal input", async () => {
    const createGoal = vi.fn().mockResolvedValue(undefined);
    mockUseGoals.mockReturnValue(buildGoalsHook({ createGoal }));
    renderGoalsPage();
    fireEvent.click(screen.getByTestId("add-goal-button"));
    const input = screen.getByTestId("add-goal-input");
    fireEvent.change(input, { target: { value: "New Goal" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(createGoal).toHaveBeenCalledWith({ title: "New Goal" });
  });

  it("should hide inline goal input when Escape is pressed", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    fireEvent.click(screen.getByTestId("add-goal-button"));
    const input = screen.getByTestId("add-goal-input");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByTestId("add-goal-input")).not.toBeInTheDocument();
  });

  it("should hide inline goal input on blur when value is empty", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    fireEvent.click(screen.getByTestId("add-goal-button"));
    const input = screen.getByTestId("add-goal-input");
    fireEvent.blur(input);
    expect(screen.queryByTestId("add-goal-input")).not.toBeInTheDocument();
  });

  it("should not render GoalCreateSheet", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    renderGoalsPage();
    expect(screen.queryByTestId("goal-create-sheet")).not.toBeInTheDocument();
  });
});
