import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import { type Clock, fakeClock } from "@/lib/temporal";
import { buildGoal } from "@/test/factories/goalFactory";
import { GoalItem } from "./GoalItem";

vi.mock("@/hooks/useIsUnsynced", () => ({
  useIsUnsynced: vi.fn().mockReturnValue(false),
}));
vi.mock("@/hooks/useAttachmentCount", () => ({
  useAttachmentCount: vi.fn().mockReturnValue({
    attachmentCount: 0,
    hasUnsyncedAttachments: false,
    isLoading: false,
  }),
}));
vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: vi
    .fn()
    .mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() }),
}));
vi.mock("@/hooks/useFileUrl", () => ({
  useFileUrl: vi.fn().mockReturnValue({ url: null }),
}));

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

function renderGoalItem(overrides = {}) {
  const goal = buildGoal();
  const props = {
    goal,
    taskCount: 0,
    onNavigate: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <GoalItem {...props} />
    </MemoryRouter>,
  );
  return props;
}

/**
 * Reproduces FR6 of fix-completed-today-stale-on-day-rollover: the finished
 * goal's date label must re-render with the correct relative day when the
 * logical day changes while the item stays mounted, not only on remount.
 */
describe("GoalItem — day boundary rollover", () => {
  // implements FR6 of fix-completed-today-stale-on-day-rollover
  it("should flip the finished-at label from today to yesterday when the day boundary is crossed while mounted", async () => {
    setFakeClock("2026-06-04T20:00:00Z", "UTC");
    const goal = buildGoal({
      status: "completed",
      updated_at: "2026-06-04T10:00:00.000Z",
    });
    renderGoalItem({ goal });

    expect(screen.getByTestId("goal-item-finished-at")).toHaveTextContent(
      /Сегодня/,
    );

    setFakeClock("2026-06-05T00:30:00Z", "UTC");
    act(() => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getByTestId("goal-item-finished-at")).toHaveTextContent(
        /Вчера/,
      );
    });
  });
});
