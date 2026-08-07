import { act, render, screen, waitFor } from "@testing-library/react";
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
import "@/test/mocks/taskPageMocks";
import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useContexts } from "@/hooks/useContexts";
import { useGoals } from "@/hooks/useGoals";
import { useTasks } from "@/hooks/useTasks";
import { type Clock, fakeClock } from "@/lib/temporal";
import CompletedPage from "./CompletedPage";

const mockUseTasks = vi.mocked(useTasks);
const mockUseGoals = vi.mocked(useGoals);
const mockUseContexts = vi.mocked(useContexts);
const mockUseCategories = vi.mocked(useCategories);
const mockUseCompletedTasks = vi.mocked(useCompletedTasks);

const clockState = vi.hoisted(() => ({
  fakeClockOverride: null as unknown,
}));

vi.mock("@/lib/temporal", async (importOriginal) => {
  const actualTemporal =
    await importOriginal<typeof import("@/lib/temporal")>();
  const resolveClock = () =>
    (clockState.fakeClockOverride as typeof actualTemporal.systemClock) ??
    actualTemporal.systemClock;
  return {
    ...actualTemporal,
    systemClock: {
      instant: () => resolveClock().instant(),
      plainDateISO: () => resolveClock().plainDateISO(),
      timeZoneId: () => resolveClock().timeZoneId(),
    },
  };
});

function setFakeClock(isoTimestamp: string, timeZone?: string) {
  clockState.fakeClockOverride = fakeClock(
    isoTimestamp,
    timeZone,
  ) as unknown as Clock;
}

function resetFakeClock() {
  clockState.fakeClockOverride = null;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CompletedPage />
    </MemoryRouter>,
  );
}

describe("CompletedPage — day boundary rollover", () => {
  beforeEach(() => {
    resetFakeClock();
    mockUseTasks.mockReturnValue(buildTasksHook());
    mockUseGoals.mockReturnValue(buildGoalsHook());
    mockUseContexts.mockReturnValue(buildContextsHook());
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    mockUseCompletedTasks.mockReturnValue(buildCompletedTasksHook());
  });

  // implements FR4 of fix-completed-today-stale-on-day-rollover
  it("should move a task from the today group to the yesterday group when the day boundary is crossed while mounted", async () => {
    setFakeClock("2026-06-04T20:00:00Z", "UTC");
    const completedTasks = [
      buildTask({
        name: "Rolling task",
        is_completed: true,
        completed_at: "2026-06-04T10:00:00.000Z",
      }),
    ];
    mockUseCompletedTasks.mockReturnValue(
      buildCompletedTasksHook({ completedTasks }),
    );
    renderPage();

    expect(screen.getByText(/Rolling task/)).toBeInTheDocument();
    expect(screen.getAllByText(/Сегодня/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText(/^Вчера/)).toHaveLength(0);

    setFakeClock("2026-06-05T00:30:00Z", "UTC");
    act(() => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Вчера/).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText(/Rolling task/)).toBeInTheDocument();
  });
});
