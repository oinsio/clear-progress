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
import { DEFAULT_DAY_BOUNDARY } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";
import { useTasks } from "@/hooks/useTasks";
import { type Clock, fakeClock } from "@/lib/temporal";
import { settingsMockState } from "@/test/mocks/settingsMocks";
import ActiveTasksPage from "./ActiveTasksPage";

/**
 * `defaultBox` and `dayBoundary` delegate to `settingsMockState`, the state
 * behind the `@/hooks/useSettings` mock registered by settingsMocks (imported
 * via taskPageMocks). A local `vi.mock("@/hooks/useSettings")` here would be
 * silently overridden by that registration and never reach the page.
 */
export const pageConfig = {
  filterBarPosition: "bottom",
  get defaultBox() {
    return settingsMockState.defaultBox;
  },
  set defaultBox(box: string) {
    settingsMockState.defaultBox = box;
  },
  get dayBoundary() {
    return settingsMockState.dayBoundary;
  },
  set dayBoundary(boundary: string) {
    settingsMockState.dayBoundary = boundary;
  },
};

const clockState = vi.hoisted(() => ({
  fakeClockOverride: null as Clock | null,
}));

vi.mock("@/lib/temporal", async (importOriginal) => {
  const actualTemporal =
    await importOriginal<typeof import("@/lib/temporal")>();
  const resolveClock = () =>
    clockState.fakeClockOverride ?? actualTemporal.systemClock;
  return {
    ...actualTemporal,
    systemClock: {
      instant: () => resolveClock().instant(),
      plainDateISO: () => resolveClock().plainDateISO(),
      timeZoneId: () => resolveClock().timeZoneId(),
    } satisfies Clock,
  };
});

/**
 * Makes the page's `systemClock` import resolve to a fixed instant
 * in the given timezone. Reset via `resetFakeClock()` or `resetDefaultMocks()`.
 */
export function setFakeClock(isoTimestamp: string, timeZone?: string) {
  clockState.fakeClockOverride = fakeClock(isoTimestamp, timeZone);
}

export function resetFakeClock() {
  clockState.fakeClockOverride = null;
}

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: pageConfig.filterBarPosition,
    setFilterBarPosition: vi.fn(),
  }),
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
  pageConfig.dayBoundary = DEFAULT_DAY_BOUNDARY;
  resetFakeClock();
  mockUseTasks.mockReturnValue(buildTasksHook());
  mockUseGoals.mockReturnValue(buildGoalsHook());
  mockUseContexts.mockReturnValue(buildContextsHook());
  mockUseCategories.mockReturnValue(buildCategoriesHook());
  mockUseCompletedTasks.mockReturnValue(buildCompletedTasksHook());
}
