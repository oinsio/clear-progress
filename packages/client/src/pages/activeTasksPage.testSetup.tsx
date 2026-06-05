import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import {
  buildCategoriesHook,
  buildCompletedTasksHook,
  buildContextsHook,
  buildGoalsHook,
  buildTasksHook,
} from "@/test/builders/hookBuilders";
import { buildTask } from "@/test/factories/taskFactory";
import "@/test/mocks/taskPageMocks";
import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";
import { useTasks } from "@/hooks/useTasks";
import ActiveTasksPage from "./ActiveTasksPage";

export const pageConfig = {
  filterBarPosition: "bottom",
  defaultBox: "today",
};

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: pageConfig.filterBarPosition,
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    get defaultBox() {
      return pageConfig.defaultBox;
    },
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn(),
    setAccentColor: vi.fn(),
  }),
  getCachedDayBoundary: () => "00:00",
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({
    handedness: "right",
    setHandedness: vi.fn(),
  }),
}));

export const mockUseTasks = vi.mocked(useTasks);
export const mockUseGoals = vi.mocked(useGoals);
export const mockUseContexts = vi.mocked(useContexts);
export const mockUseCategories = vi.mocked(useCategories);
export const mockUseCompletedTasks = vi.mocked(useCompletedTasks);

export {
  buildCompletedTasksHook,
  buildTasksHook,
} from "@/test/builders/hookBuilders";
export { buildTask } from "@/test/factories/taskFactory";

export function renderPage() {
  return render(
    <MemoryRouter>
      <ActiveTasksPage />
    </MemoryRouter>,
  );
}

export function selectBoxFilter(box: string) {
  fireEvent.click(screen.getByTestId("command-bar-filter-toggle"));
  fireEvent.click(screen.getByTestId(`box-filter-${box}`));
}

export function setupAllBoxTasks() {
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

export function resetDefaultMocks() {
  pageConfig.defaultBox = "today";
  pageConfig.filterBarPosition = "bottom";
  mockUseTasks.mockReturnValue(buildTasksHook());
  mockUseGoals.mockReturnValue(buildGoalsHook());
  mockUseContexts.mockReturnValue(buildContextsHook());
  mockUseCategories.mockReturnValue(buildCategoriesHook());
  mockUseCompletedTasks.mockReturnValue(buildCompletedTasksHook());
}
