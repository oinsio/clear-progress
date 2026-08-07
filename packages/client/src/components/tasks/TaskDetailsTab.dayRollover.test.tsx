import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DAY_BOUNDARY_CHANGED_EVENT } from "@/constants";
import { type Clock, fakeClock } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import type { Box, RepeatRule } from "@/types/common";

vi.mock("@/hooks/useSettings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useSettings")>()),
  useSettings: () => ({ defaultBox: "today" }),
}));

vi.mock("@/hooks/useRepeatRuleChangeDialog", () => ({
  useRepeatRuleChangeDialog: () => ({
    pendingRuleChange: null,
    handleRepeatChange: vi.fn(),
    handleRuleChangeConfirm: vi.fn(),
    handleRuleChangeCancel: vi.fn(),
  }),
}));

vi.mock("@/components/ui/EditableDescription", () => ({
  EditableDescription: () => <textarea data-testid="mock-description" />,
}));

vi.mock("./TaskDetailSelector", () => ({
  TaskDetailSelector: () => <div data-testid="mock-selector" />,
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

// Import after mocks so the mocked systemClock is captured everywhere.
const { TaskDetailsTab } = await import("./TaskDetailsTab");

const VALID_DAILY_RULE: RepeatRule = {
  type: "fixed",
  frequency: "daily",
  interval: 1,
  target_box: "today" as Box,
  advance_days: 0,
};

function detailsTabProps(
  overrides: Partial<Parameters<typeof TaskDetailsTab>[0]> = {},
): Parameters<typeof TaskDetailsTab>[0] {
  return {
    task: buildTask(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onMove: vi.fn().mockResolvedValue(undefined),
    onDuplicate: vi.fn().mockResolvedValue(undefined),
    description: "",
    setDescription: vi.fn(),
    selectedBox: "today" as Box,
    setSelectedBox: vi.fn(),
    selectedGoalId: "",
    setSelectedGoalId: vi.fn(),
    selectedGoalName: "",
    selectedContextId: "",
    setSelectedContextId: vi.fn(),
    selectedContextName: "",
    selectedCategoryId: "",
    setSelectedCategoryId: vi.fn(),
    selectedCategoryName: "",
    selectedRepeatRule: VALID_DAILY_RULE,
    setSelectedRepeatRule: vi.fn(),
    goals: [],
    contexts: [],
    categories: [],
    openSelector: null,
    onOpenSelector: vi.fn(),
    onCloseSelector: vi.fn(),
    ...overrides,
  };
}

/**
 * Reproduces FR7 of fix-completed-today-stale-on-day-rollover: the next-date
 * "Today"/"Tomorrow" label must re-render with the correct relative day when
 * the logical day changes while the tab stays mounted, not only on remount.
 */
describe("TaskDetailsTab — day boundary rollover", () => {
  // implements FR7 of fix-completed-today-stale-on-day-rollover
  it("should flip the next-date label from tomorrow to today when the day boundary is crossed while mounted", async () => {
    setFakeClock("2026-06-04T20:00:00Z", "UTC");
    const task = buildTask({
      repeat_rule: JSON.stringify(VALID_DAILY_RULE),
      next_date: "2026-06-05",
    });
    render(<TaskDetailsTab {...detailsTabProps({ task })} />);

    expect(screen.getByTestId("next-date-line")).toHaveTextContent(/завтра/);

    setFakeClock("2026-06-05T00:30:00Z", "UTC");
    act(() => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    await waitFor(() => {
      expect(screen.getByTestId("next-date-line")).toHaveTextContent(/сегодня/);
    });
  });
});
