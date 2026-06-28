import { renderHook } from "@testing-library/react";
import { describe, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { SETTINGS_KEYS } from "@clear-progress/contract";
import { useFocusedGoals } from "./useFocusedGoals";
import {
  createGoal,
  expectSettingsValues,
  mockSchedulePush,
  setupFocusedGoals,
  setupFocusedGoalsTests,
  UUID_1,
  UUID_2,
  UUID_A,
  UUID_B,
  UUID_INVALID,
  waitForFocusedGoals,
} from "./useFocusedGoals.test-utils";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ schedulePush: mockSchedulePush }),
}));

describe("useFocusedGoals", () => {
  const deps = setupFocusedGoalsTests();

  async function renderFocusedGoals(...goalIds: string[]) {
    await setupFocusedGoals(
      deps.goalRepo,
      deps.settingsRepo,
      goalIds[0],
      goalIds[1],
    );
    const { result } = renderHook(() =>
      useFocusedGoals(deps.settingsRepo, deps.goalRepo),
    );
    await waitForFocusedGoals(result, goalIds);
    return result;
  }

  describe("Auto-cleanup of invalid goals", () => {
    it("should remove soft-deleted goal from focus", async () => {
      const result = await renderFocusedGoals(UUID_1, UUID_2);

      // Soft-delete UUID_1
      await deps.goalRepo.update(
        createGoal(UUID_1, {
          is_deleted: true,
          syncStatus: "pending" as const,
        }),
      );

      await waitForFocusedGoals(result, [UUID_2]);

      await expectSettingsValues(deps.settingsRepo, UUID_2, "");
    });

    it.each([
      "completed",
      "cancelled",
    ] as const)("should remove %s goal from focus", async (status) => {
      const result = await renderFocusedGoals(UUID_1);

      await deps.goalRepo.update(
        createGoal(UUID_1, {
          status,
          syncStatus: "pending" as const,
        }),
      );

      await waitForFocusedGoals(result, []);

      await expectSettingsValues(deps.settingsRepo, "", "");
    });

    it("should remove both goals when both become invalid", async () => {
      const result = await renderFocusedGoals(UUID_1, UUID_2);

      // Delete both
      await deps.goalRepo.update(
        createGoal(UUID_1, {
          is_deleted: true,
          syncStatus: "pending" as const,
        }),
      );
      await deps.goalRepo.update(
        createGoal(UUID_2, {
          is_deleted: true,
          syncStatus: "pending" as const,
        }),
      );

      await waitForFocusedGoals(result, []);

      await expectSettingsValues(deps.settingsRepo, "", "");
    });
  });

  describe("Self-healing of corrupted data", () => {
    it("should clear invalid UUID in focused_goal_1 and shift focused_goal_2", async () => {
      await deps.goalRepo.create(createGoal(UUID_B));
      await deps.settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, "corrupted");
      await deps.settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, UUID_B);

      const { result } = renderHook(() =>
        useFocusedGoals(deps.settingsRepo, deps.goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_B]);

      await expectSettingsValues(deps.settingsRepo, UUID_B, "");
    });

    it("should clear goal ID when goal does not exist in IndexedDB", async () => {
      await deps.goalRepo.create(createGoal(UUID_B));
      await deps.settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, UUID_INVALID);
      await deps.settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, UUID_B);

      const { result } = renderHook(() =>
        useFocusedGoals(deps.settingsRepo, deps.goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_B]);

      await expectSettingsValues(deps.settingsRepo, UUID_B, "");
    });

    it("should clear both slots when both are corrupted", async () => {
      await deps.settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, "corrupted1");
      await deps.settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, "corrupted2");

      const { result } = renderHook(() =>
        useFocusedGoals(deps.settingsRepo, deps.goalRepo),
      );

      await waitForFocusedGoals(result, []);

      await expectSettingsValues(deps.settingsRepo, "", "");
    });

    it("should clear only focused_goal_2 when it is corrupted", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_A);
      await deps.settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, "corrupted");

      const { result } = renderHook(() =>
        useFocusedGoals(deps.settingsRepo, deps.goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_A]);

      await expectSettingsValues(deps.settingsRepo, UUID_A, "");
    });
  });
});
