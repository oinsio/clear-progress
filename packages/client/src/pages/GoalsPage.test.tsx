/**
 * Tests for GoalsPage.
 * Implements FR20 of command-bar.
 * Implements FR3, FR4, FR5, FR10 of goals-filter.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoalsHook } from "@/test/builders/hookBuilders";
import { buildGoal } from "@/test/factories/goalFactory";
import "./entityPage.testSetup";
import GoalsPage from "./GoalsPage";

vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useGoalFilter");
vi.mock("@/services/TaskService", () => ({
  TaskService: vi.fn().mockImplementation(() => ({
    getGoalTaskCounts: vi.fn().mockResolvedValue({}),
  })),
}));

import { useGoalFilter } from "@/hooks/useGoalFilter";
import { useGoals } from "@/hooks/useGoals";
import { usePanelSide } from "@/hooks/usePanelSide";

const mockUseGoals = vi.mocked(useGoals);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUseGoalFilter = vi.mocked(useGoalFilter);
const mockSetGoalFilter = vi.fn();

function renderGoalsPage() {
  mockUsePanelSide.mockReturnValue({
    panelSide: "right",
    setPanelSide: vi.fn(),
  });

  render(
    <MemoryRouter>
      <GoalsPage />
    </MemoryRouter>,
  );
}

describe("GoalsPage", () => {
  beforeEach(() => {
    mockUseGoals.mockReturnValue(buildGoalsHook());
    mockUseGoalFilter.mockReturnValue({
      goalFilter: "all",
      setGoalFilter: mockSetGoalFilter,
    });
  });

  it("should render page with test-id 'goals-page'", () => {
    renderGoalsPage();
    expect(screen.getByTestId("goals-page")).toBeInTheDocument();
  });

  it("should render header", () => {
    renderGoalsPage();
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });

  it("should render goal items for each active goal", () => {
    const goals = [
      buildGoal({ name: "Goal A", status: "in_progress" }),
      buildGoal({ name: "Goal B", status: "planning" }),
    ];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));

    renderGoalsPage();
    expect(screen.getByText("Goal A")).toBeInTheDocument();
    expect(screen.getByText("Goal B")).toBeInTheDocument();
  });

  it("should not render deleted goals", () => {
    const goals = [
      buildGoal({ name: "Active Goal", status: "in_progress" }),
      buildGoal({ name: "Deleted Goal", is_deleted: true }),
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
    mockUseGoals.mockReturnValue(
      buildGoalsHook({ goals: [buildGoal({ status: "in_progress" })] }),
    );

    renderGoalsPage();
    expect(screen.queryByTestId("empty-goals-message")).not.toBeInTheDocument();
  });

  // FR-20: renders CommandBar
  it("should render CommandBar", () => {
    renderGoalsPage();
    expect(screen.getByTestId("command-bar")).toBeInTheDocument();
  });

  // FR3 of goals-filter: CommandBar has filter toggle
  it("should render CommandBar filter toggle", () => {
    renderGoalsPage();
    expect(screen.getByTestId("command-bar-filter-toggle")).toBeInTheDocument();
  });

  // FR10 of goals-filter: CommandBar has no eye toggle
  it("should not render CommandBar eye toggle", () => {
    renderGoalsPage();
    expect(
      screen.queryByTestId("command-bar-eye-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has entity icon
  it("should render CommandBar entity icon", () => {
    renderGoalsPage();
    expect(screen.getByTestId("command-bar-entity-icon")).toBeInTheDocument();
  });

  // FR-20: CommandBar has a create button
  it("should render CommandBar create button", () => {
    renderGoalsPage();
    expect(screen.getByTestId("command-bar-create-button")).toBeInTheDocument();
  });

  // FR-20: creates goal via CommandBar submit
  it("should call createGoal when submitting via CommandBar", async () => {
    const createGoal = vi.fn().mockResolvedValue(undefined);
    mockUseGoals.mockReturnValue(buildGoalsHook({ createGoal }));
    renderGoalsPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "New Goal" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createGoal).toHaveBeenCalledWith({ name: "New Goal" });
    });
  });

  // FR-20: no old inline add buttons
  it("should not render old add-goal-button", () => {
    renderGoalsPage();
    expect(screen.queryByTestId("add-goal-button")).not.toBeInTheDocument();
  });

  it("should not render old add-task-button", () => {
    renderGoalsPage();
    expect(screen.queryByTestId("add-task-button")).not.toBeInTheDocument();
  });

  it("should not render GoalCreateSheet", () => {
    renderGoalsPage();
    expect(screen.queryByTestId("goal-create-sheet")).not.toBeInTheDocument();
  });

  // FR4 of goals-filter: active filter shows only planning and in_progress goals
  it("should show only active goals when filter is 'active'", () => {
    mockUseGoalFilter.mockReturnValue({
      goalFilter: "active",
      setGoalFilter: mockSetGoalFilter,
    });
    const goals = [
      buildGoal({ name: "In Progress Goal", status: "in_progress" }),
      buildGoal({ name: "Planning Goal", status: "planning" }),
      buildGoal({ name: "Paused Goal", status: "paused" }),
      buildGoal({ name: "Completed Goal", status: "completed" }),
    ];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));

    renderGoalsPage();
    expect(screen.getByText("In Progress Goal")).toBeInTheDocument();
    expect(screen.getByText("Planning Goal")).toBeInTheDocument();
    expect(screen.queryByText("Paused Goal")).not.toBeInTheDocument();
    expect(screen.queryByText("Completed Goal")).not.toBeInTheDocument();
  });

  // FR4 of goals-filter: paused filter shows only paused goals
  it("should show only paused goals when filter is 'paused'", () => {
    mockUseGoalFilter.mockReturnValue({
      goalFilter: "paused",
      setGoalFilter: mockSetGoalFilter,
    });
    const goals = [
      buildGoal({ name: "Active Goal", status: "in_progress" }),
      buildGoal({ name: "Paused Goal", status: "paused" }),
    ];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));

    renderGoalsPage();
    expect(screen.queryByText("Active Goal")).not.toBeInTheDocument();
    expect(screen.getByText("Paused Goal")).toBeInTheDocument();
  });

  // FR4 of goals-filter: finished filter shows completed and cancelled goals
  it("should show only finished goals when filter is 'finished'", () => {
    mockUseGoalFilter.mockReturnValue({
      goalFilter: "finished",
      setGoalFilter: mockSetGoalFilter,
    });
    const goals = [
      buildGoal({ name: "Active Goal", status: "in_progress" }),
      buildGoal({ name: "Completed Goal", status: "completed" }),
      buildGoal({ name: "Cancelled Goal", status: "cancelled" }),
    ];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));

    renderGoalsPage();
    expect(screen.queryByText("Active Goal")).not.toBeInTheDocument();
    expect(screen.getByText("Completed Goal")).toBeInTheDocument();
    expect(screen.getByText("Cancelled Goal")).toBeInTheDocument();
  });

  // FR4 of goals-filter: all filter shows all non-deleted goals
  it("should show all non-deleted goals when filter is 'all'", () => {
    const goals = [
      buildGoal({ name: "In Progress", status: "in_progress" }),
      buildGoal({ name: "Paused", status: "paused" }),
      buildGoal({ name: "Completed", status: "completed" }),
      buildGoal({ name: "Deleted", is_deleted: true, status: "in_progress" }),
    ];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));

    renderGoalsPage();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("Deleted")).not.toBeInTheDocument();
  });

  // FR5 of goals-filter: empty state shows filter-specific message for active
  it("should show filter-specific empty message for active filter", () => {
    mockUseGoalFilter.mockReturnValue({
      goalFilter: "active",
      setGoalFilter: mockSetGoalFilter,
    });
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [] }));

    renderGoalsPage();
    const emptyMessage = screen.getByTestId("empty-goals-message");
    expect(emptyMessage).toHaveTextContent("Нет активных целей");
  });

  // FR5 of goals-filter: empty state shows filter-specific message for paused
  it("should show filter-specific empty message for paused filter", () => {
    mockUseGoalFilter.mockReturnValue({
      goalFilter: "paused",
      setGoalFilter: mockSetGoalFilter,
    });
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [] }));

    renderGoalsPage();
    const emptyMessage = screen.getByTestId("empty-goals-message");
    expect(emptyMessage).toHaveTextContent("Нет целей на паузе");
  });

  // FR5 of goals-filter: empty state shows filter-specific message for finished
  it("should show filter-specific empty message for finished filter", () => {
    mockUseGoalFilter.mockReturnValue({
      goalFilter: "finished",
      setGoalFilter: mockSetGoalFilter,
    });
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [] }));

    renderGoalsPage();
    const emptyMessage = screen.getByTestId("empty-goals-message");
    expect(emptyMessage).toHaveTextContent("Нет завершённых целей");
  });

  // FR5 of goals-filter: empty state shows default message for all filter
  it("should show default empty message for all filter", () => {
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [] }));

    renderGoalsPage();
    const emptyMessage = screen.getByTestId("empty-goals-message");
    expect(emptyMessage).toHaveTextContent("Нет ни одной цели");
  });
});
