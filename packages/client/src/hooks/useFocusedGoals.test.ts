import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { SETTINGS_KEYS } from "@clear-progress/contract";
import { db } from "@/db/database";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import type { Goal } from "@/types/entities";
import { useFocusedGoals } from "./useFocusedGoals";

const mockSchedulePush = vi.fn();

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ schedulePush: mockSchedulePush }),
}));

// Test UUIDs
const UUID_1 = "00000000-0000-4000-8000-000000000001";
const UUID_2 = "00000000-0000-4000-8000-000000000002";
const UUID_3 = "00000000-0000-4000-8000-000000000003";
const UUID_A = "00000000-0000-4000-8000-00000000000a";
const UUID_B = "00000000-0000-4000-8000-00000000000b";
const UUID_C = "00000000-0000-4000-8000-00000000000c";
const UUID_INVALID = "00000000-0000-4000-8000-000000000999";

const createGoal = (id: string, overrides: Partial<Goal> = {}): Goal => ({
  id,
  name: `Goal ${id}`,
  description: "",
  cover_file_id: "",
  status: "in_progress",
  sort_order: 0,
  is_deleted: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  version: 1,
  revision: 1,
  needsSync: false,
  ...overrides,
});

// Helper: setup focused goals in settings
async function setupFocusedGoals(
  goalRepo: GoalRepository,
  settingsRepo: SettingsRepository,
  goal1Id?: string,
  goal2Id?: string,
): Promise<void> {
  if (goal1Id) {
    await goalRepo.create(createGoal(goal1Id));
    await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, goal1Id);
  }
  if (goal2Id) {
    await goalRepo.create(createGoal(goal2Id));
    await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, goal2Id);
  }
}

// Helper: wait for focused goals to match expected IDs
async function waitForFocusedGoals(
  result: { current: ReturnType<typeof useFocusedGoals> },
  expectedIds: string[],
): Promise<void> {
  await waitFor(
    () => {
      expect(result.current.focusedGoalIds).toEqual(expectedIds);
    },
    { timeout: 3000 },
  );
}

// Helper: verify settings values
async function expectSettingsValues(
  settingsRepo: SettingsRepository,
  expectedGoal1: string,
  expectedGoal2: string,
): Promise<void> {
  const value1 = await settingsRepo.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1);
  const value2 = await settingsRepo.getValue(SETTINGS_KEYS.FOCUSED_GOAL_2);
  expect(value1).toBe(expectedGoal1);
  expect(value2).toBe(expectedGoal2);
}

describe("useFocusedGoals", () => {
  let settingsRepo: SettingsRepository;
  let goalRepo: GoalRepository;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    settingsRepo = new SettingsRepository();
    goalRepo = new GoalRepository();
    mockSchedulePush.mockClear();
  });

  describe("Reading focused goals", () => {
    it("should return empty array when no goals are focused", async () => {
      const { result } = renderHook(() => useFocusedGoals());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.focusedGoalIds).toEqual([]);
    });

    it("should return one goal when focused_goal_1 is set", async () => {
      await goalRepo.create(createGoal(UUID_1));
      await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitFor(() => {
        expect(result.current.focusedGoalIds).toEqual([UUID_1]);
      });
    });

    it("should return two goals when both slots are filled", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1, UUID_2);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);
    });

    it("should maintain order: focused_goal_1 first, focused_goal_2 second", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_A, UUID_B);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);
    });
  });

  describe("Adding goals to focus", () => {
    it("should add first goal to focused_goal_1", async () => {
      await goalRepo.create(createGoal(UUID_1));

      const { result } = renderHook(() => useFocusedGoals());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const status = await result.current.addGoalToFocus(UUID_1);
        expect(status).toBe("added");
      });

      await waitFor(() => {
        expect(result.current.focusedGoalIds).toEqual([UUID_1]);
      });

      const value = await settingsRepo.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1);
      expect(value).toBe(UUID_1);
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should add second goal to focused_goal_2", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1);
      await goalRepo.create(createGoal(UUID_2));

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        const status = await result.current.addGoalToFocus(UUID_2);
        expect(status).toBe("added");
      });

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      const value = await settingsRepo.getValue(SETTINGS_KEYS.FOCUSED_GOAL_2);
      expect(value).toBe(UUID_2);
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should return 'limit_reached' when trying to add third goal", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1, UUID_2);
      await goalRepo.create(createGoal(UUID_3));

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      await act(async () => {
        const status = await result.current.addGoalToFocus(UUID_3);
        expect(status).toBe("limit_reached");
      });

      expect(result.current.focusedGoalIds).toEqual([UUID_1, UUID_2]);
      expect(mockSchedulePush).not.toHaveBeenCalled();
    });

    it("should not add goal that is already focused", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        const status = await result.current.addGoalToFocus(UUID_1);
        expect(status).toBe("added");
      });

      expect(result.current.focusedGoalIds).toEqual([UUID_1]);
      expect(mockSchedulePush).not.toHaveBeenCalled();
    });
  });

  describe("Removing goals from focus", () => {
    it("should remove only focused goal", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        await result.current.removeGoalFromFocus(UUID_1);
      });

      await waitForFocusedGoals(result, []);

      await expectSettingsValues(settingsRepo, "", "");
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should shift goal from position 2 to position 1 when removing from position 1", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_A, UUID_B);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);

      await act(async () => {
        await result.current.removeGoalFromFocus(UUID_A);
      });

      await waitForFocusedGoals(result, [UUID_B]);

      await expectSettingsValues(settingsRepo, UUID_B, "");
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should remove from position 2 without shifting", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_A, UUID_B);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);

      await act(async () => {
        await result.current.removeGoalFromFocus(UUID_B);
      });

      await waitForFocusedGoals(result, [UUID_A]);

      await expectSettingsValues(settingsRepo, UUID_A, "");
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when removing goal that is not focused", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        await result.current.removeGoalFromFocus(UUID_INVALID);
      });

      expect(result.current.focusedGoalIds).toEqual([UUID_1]);
      expect(mockSchedulePush).not.toHaveBeenCalled();
    });
  });

  describe("isGoalFocused", () => {
    it("should return false when goal is not focused", async () => {
      const { result } = renderHook(() => useFocusedGoals());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isGoalFocused(UUID_1)).toBe(false);
    });

    it("should return true when goal is in focused_goal_1", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      expect(result.current.isGoalFocused(UUID_1)).toBe(true);
    });

    it("should return true when goal is in focused_goal_2", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1, UUID_2);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      expect(result.current.isGoalFocused(UUID_2)).toBe(true);
    });
  });

  describe("replaceGoalInFocus", () => {
    it("should replace first goal and shift remaining to position 1", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_A, UUID_B);
      await goalRepo.create(createGoal(UUID_C));

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);

      await act(async () => {
        await result.current.replaceGoalInFocus(UUID_A, UUID_C);
      });

      await waitForFocusedGoals(result, [UUID_B, UUID_C]);

      await expectSettingsValues(settingsRepo, UUID_B, UUID_C);
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should replace second goal keeping first in place", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_A, UUID_B);
      await goalRepo.create(createGoal(UUID_C));

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);

      await act(async () => {
        await result.current.replaceGoalInFocus(UUID_B, UUID_C);
      });

      await waitForFocusedGoals(result, [UUID_A, UUID_C]);

      await expectSettingsValues(settingsRepo, UUID_A, UUID_C);
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when old goal is not focused", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        await result.current.replaceGoalInFocus(UUID_INVALID, UUID_2);
      });

      expect(result.current.focusedGoalIds).toEqual([UUID_1]);
      expect(mockSchedulePush).not.toHaveBeenCalled();
    });
  });

  describe("Auto-cleanup of invalid goals", () => {
    it("should remove soft-deleted goal from focus", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1, UUID_2);

      const { result } = renderHook(() =>
        useFocusedGoals(settingsRepo, goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      // Soft-delete UUID_1
      await goalRepo.update(
        createGoal(UUID_1, { is_deleted: true, needsSync: true }),
      );

      await waitForFocusedGoals(result, [UUID_2]);

      await expectSettingsValues(settingsRepo, UUID_2, "");
    });

    it("should remove completed goal from focus", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1);

      const { result } = renderHook(() =>
        useFocusedGoals(settingsRepo, goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_1]);

      // Complete UUID_1
      await goalRepo.update(
        createGoal(UUID_1, { status: "completed", needsSync: true }),
      );

      await waitForFocusedGoals(result, []);

      const value1 = await settingsRepo.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1);
      expect(value1).toBe("");
    });

    it("should remove cancelled goal from focus", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1);

      const { result } = renderHook(() =>
        useFocusedGoals(settingsRepo, goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_1]);

      // Cancel UUID_1
      await goalRepo.update(
        createGoal(UUID_1, { status: "cancelled", needsSync: true }),
      );

      await waitForFocusedGoals(result, []);

      const value1 = await settingsRepo.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1);
      expect(value1).toBe("");
    });

    it("should remove both goals when both become invalid", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_1, UUID_2);

      const { result } = renderHook(() =>
        useFocusedGoals(settingsRepo, goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      // Delete both
      await goalRepo.update(
        createGoal(UUID_1, { is_deleted: true, needsSync: true }),
      );
      await goalRepo.update(
        createGoal(UUID_2, { is_deleted: true, needsSync: true }),
      );

      await waitForFocusedGoals(result, []);

      await expectSettingsValues(settingsRepo, "", "");
    });
  });

  describe("Self-healing of corrupted data", () => {
    it("should clear invalid UUID in focused_goal_1 and shift focused_goal_2", async () => {
      await goalRepo.create(createGoal(UUID_B));
      await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, "corrupted");
      await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, UUID_B);

      const { result } = renderHook(() =>
        useFocusedGoals(settingsRepo, goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_B]);

      await expectSettingsValues(settingsRepo, UUID_B, "");
    });

    it("should clear goal ID when goal does not exist in IndexedDB", async () => {
      await goalRepo.create(createGoal(UUID_B));
      await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, UUID_INVALID);
      await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, UUID_B);

      const { result } = renderHook(() =>
        useFocusedGoals(settingsRepo, goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_B]);

      await expectSettingsValues(settingsRepo, UUID_B, "");
    });

    it("should clear both slots when both are corrupted", async () => {
      await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, "corrupted1");
      await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, "corrupted2");

      const { result } = renderHook(() =>
        useFocusedGoals(settingsRepo, goalRepo),
      );

      await waitForFocusedGoals(result, []);

      // Wait for self-healing to complete
      await waitFor(async () => {
        const value1 = await settingsRepo.getValue(
          SETTINGS_KEYS.FOCUSED_GOAL_1,
        );
        const value2 = await settingsRepo.getValue(
          SETTINGS_KEYS.FOCUSED_GOAL_2,
        );
        expect(value1).toBe("");
        expect(value2).toBe("");
      });
    });

    it("should clear only focused_goal_2 when it is corrupted", async () => {
      await setupFocusedGoals(goalRepo, settingsRepo, UUID_A);
      await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, "corrupted");

      const { result } = renderHook(() =>
        useFocusedGoals(settingsRepo, goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_A]);

      await expectSettingsValues(settingsRepo, UUID_A, "");
    });
  });
});
