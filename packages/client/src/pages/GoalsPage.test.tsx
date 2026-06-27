/**
 * Tests for GoalsPage.
 * Implements FR20 of command-bar.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoalsHook } from "@/test/builders/hookBuilders";
import { buildGoal } from "@/test/factories/goalFactory";
import "./entityPage.testSetup";
import GoalsPage from "./GoalsPage";

vi.mock("@/hooks/useGoals");
vi.mock("@/services/TaskService", () => ({
  TaskService: vi.fn().mockImplementation(() => ({
    getGoalTaskCounts: vi.fn().mockResolvedValue({}),
  })),
}));

import { useGoals } from "@/hooks/useGoals";
import { usePanelSide } from "@/hooks/usePanelSide";

const mockUseGoals = vi.mocked(useGoals);
const mockUsePanelSide = vi.mocked(usePanelSide);

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
      buildGoal({ name: "Goal A" }),
      buildGoal({ name: "Goal B" }),
    ];
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals }));

    renderGoalsPage();
    expect(screen.getByText("Goal A")).toBeInTheDocument();
    expect(screen.getByText("Goal B")).toBeInTheDocument();
  });

  it("should not render deleted goals", () => {
    const goals = [
      buildGoal({ name: "Active Goal" }),
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
    mockUseGoals.mockReturnValue(buildGoalsHook({ goals: [buildGoal()] }));

    renderGoalsPage();
    expect(screen.queryByTestId("empty-goals-message")).not.toBeInTheDocument();
  });

  // FR-20: renders CommandBar
  it("should render CommandBar", () => {
    renderGoalsPage();
    expect(screen.getByTestId("command-bar")).toBeInTheDocument();
  });

  // FR-20: CommandBar has no filter
  it("should not render CommandBar filter toggle", () => {
    renderGoalsPage();
    expect(
      screen.queryByTestId("command-bar-filter-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has no eye toggle
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
});
