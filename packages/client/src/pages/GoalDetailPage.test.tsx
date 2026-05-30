import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UseGoalReturn } from "@/hooks/useGoal";
import type { UseGoalTasksReturn } from "@/hooks/useGoalTasks";
import type { UseSettingsReturn } from "@/hooks/useSettings";
import { buildGoalsHook } from "@/test/builders/hookBuilders";
import { buildGoal } from "@/test/factories/goalFactory";
import type { Task } from "@/types/entities";
import GoalDetailPage from "./GoalDetailPage";

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
vi.mock("@/hooks/useGoal");
vi.mock("@/hooks/useGoalTasks");
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useContexts");
vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/useSidebarNavigation");
vi.mock("@/hooks/useIsDesktop");
vi.mock("@/hooks/usePanelSplit");
vi.mock("@/hooks/useCoverUrl");
vi.mock("@/hooks/useCoverPreview");
vi.mock("@/hooks/useSettings");

import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useCoverPreview } from "@/hooks/useCoverPreview";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import { useGoal } from "@/hooks/useGoal";
import { useGoals } from "@/hooks/useGoals";
import { useGoalTasks } from "@/hooks/useGoalTasks";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useSettings } from "@/hooks/useSettings";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";

const mockUseGoal = vi.mocked(useGoal);
const mockUseGoalTasks = vi.mocked(useGoalTasks);
const mockUseGoals = vi.mocked(useGoals);
const mockUseContexts = vi.mocked(useContexts);
const mockUseCategories = vi.mocked(useCategories);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUseSidebarNavigation = vi.mocked(useSidebarNavigation);
const mockUseIsDesktop = vi.mocked(useIsDesktop);
const mockUsePanelSplit = vi.mocked(usePanelSplit);
const mockUseCoverUrl = vi.mocked(useCoverUrl);
const mockUseCoverPreview = vi.mocked(useCoverPreview);
const mockUseSettings = vi.mocked(useSettings);

function buildGoalHook(overrides: Partial<UseGoalReturn> = {}): UseGoalReturn {
  return {
    goal: buildGoal({ name: "Моя цель" }),
    tasks: [],
    isLoading: false,
    updateGoal: vi.fn().mockResolvedValue(undefined),
    updateGoalStatus: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildGoalTasksHook(
  overrides: Partial<UseGoalTasksReturn> = {},
): UseGoalTasksReturn {
  return {
    tasks: [],
    completedTasks: [],
    isLoading: false,
    createTask: vi.fn().mockResolvedValue(undefined),
    completeTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    moveTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    duplicateTask: vi.fn().mockResolvedValue({} as Task),
    reorderTasks: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildSettingsHook(
  overrides: Partial<UseSettingsReturn> = {},
): UseSettingsReturn {
  return {
    defaultBox: "inbox",
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn().mockResolvedValue(undefined),
    setAccentColor: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/goals/test-id"]}>
      <Routes>
        <Route path="/goals/:id" element={<GoalDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GoalDetailPage — inline task creation", () => {
  beforeEach(() => {
    mockUseGoal.mockReturnValue(buildGoalHook());
    mockUseGoalTasks.mockReturnValue(buildGoalTasksHook());
    mockUseGoals.mockReturnValue(buildGoalsHook());
    mockUseContexts.mockReturnValue({
      contexts: [],
      isLoading: false,
      createContext: vi.fn(),
      updateContext: vi.fn(),
      deleteContext: vi.fn(),
      reorderContexts: vi.fn(),
    });
    mockUseCategories.mockReturnValue({
      categories: [],
      isLoading: false,
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      reorderCategories: vi.fn(),
    });
    mockUsePanelSide.mockReturnValue({
      panelSide: "right",
      setPanelSide: vi.fn(),
    });
    mockUsePanelOpen.mockReturnValue({
      isPanelOpen: false,
      togglePanelOpen: vi.fn(),
    });
    mockUseSidebarNavigation.mockReturnValue(vi.fn());
    mockUseIsDesktop.mockReturnValue(false);
    mockUsePanelSplit.mockReturnValue({
      ratio: 0.5,
      setRatio: vi.fn(),
      containerRef: { current: null },
      handleResizeMouseDown: vi.fn(),
    });
    mockUseCoverUrl.mockReturnValue({ url: null });
    mockUseCoverPreview.mockReturnValue(null);
    mockUseSettings.mockReturnValue(buildSettingsHook());
  });

  it("should render the FAB add-task button", () => {
    renderPage();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });

  it("should show inline input when FAB is clicked", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    expect(screen.getByTestId("add-task-input")).toBeInTheDocument();
  });

  it("should hide inline input after Escape", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
  });

  it("should call createTask with name and defaultBox when Enter is pressed", async () => {
    const createTask = vi.fn().mockResolvedValue(undefined);
    mockUseGoalTasks.mockReturnValue(buildGoalTasksHook({ createTask }));
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Новая задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith("Новая задача", "inbox", "");
    });
  });

  it("should hide inline input after successful task creation", async () => {
    const createTask = vi.fn().mockResolvedValue(undefined);
    mockUseGoalTasks.mockReturnValue(buildGoalTasksHook({ createTask }));
    renderPage();
    fireEvent.click(screen.getByTestId("add-task-button"));
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.queryByTestId("add-task-input")).not.toBeInTheDocument();
    });
  });
});
