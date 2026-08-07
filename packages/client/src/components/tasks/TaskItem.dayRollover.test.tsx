import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import { type Clock, fakeClock } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import { TaskItem } from "./TaskItem";

vi.mock("@/hooks/useChecklist", () => ({
  useChecklist: vi.fn().mockReturnValue({
    items: [],
    progress: { completed: 0, total: 0 },
    hasUnsyncedItems: false,
    isLoading: false,
    reload: vi.fn(),
    createItem: vi.fn(),
    toggleItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    reorderItems: vi.fn(),
  }),
}));

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: vi.fn().mockReturnValue(false),
}));

vi.mock("@/hooks/useHasTouchPointer", () => ({
  useHasTouchPointer: vi.fn().mockReturnValue(false),
}));

vi.mock("@/hooks/useAttachmentCount", () => ({
  useAttachmentCount: vi.fn().mockReturnValue({
    attachmentCount: 0,
    hasUnsyncedAttachments: false,
    isLoading: false,
  }),
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

function taskItemProps(
  overrides: Partial<Parameters<typeof TaskItem>[0]> = {},
): Parameters<typeof TaskItem>[0] {
  return {
    task: buildTask(),
    goals: [],
    contexts: [],
    categories: [],
    onComplete: vi.fn(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onMove: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn(),
    ...overrides,
  };
}

/**
 * Reproduces FR5 of fix-completed-today-stale-on-day-rollover: the
 * completed-at label must re-render with the correct relative day when the
 * logical day changes while the item stays mounted, not only on remount.
 */
describe("TaskItem — day boundary rollover", () => {
  // implements FR5 of fix-completed-today-stale-on-day-rollover
  it("should flip the completed-at label from today to yesterday when the day boundary is crossed while mounted", async () => {
    setFakeClock("2026-06-04T20:00:00Z", "UTC");
    const task = buildTask({
      is_completed: true,
      completed_at: "2026-06-04T10:00:00.000Z",
    });
    render(<TaskItem {...taskItemProps({ task })} />);

    expect(screen.getByTestId("task-item-completed-at")).toHaveTextContent(
      /Сегодня/,
    );

    setFakeClock("2026-06-05T00:30:00Z", "UTC");
    act(() => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getByTestId("task-item-completed-at")).toHaveTextContent(
        /Вчера/,
      );
    });
  });
});
