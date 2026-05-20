import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  describe("Auto-cleanup of invalid goals", () => {
    it("should remove soft-deleted goal from focus", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1, UUID_2);

      const { result } = renderHook(() =>
        useFocusedGoals(deps.settingsRepo, deps.goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      // Soft-delete UUID_1
      await deps.goalRepo.update(
        createGoal(UUID_1, { is_deleted: true, needsSync: true }),
      );

      await waitForFocusedGoals(result, [UUID_2]);

      await expectSettingsValues(deps.settingsRepo, UUID_2, "");
    });

    it("should remove completed goal from focus", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);

      const { result } = renderHook(() =>
        useFocusedGoals(deps.settingsRepo, deps.goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_1]);

      // Complete UUID_1
      await deps.goalRepo.update(
        createGoal(UUID_1, { status: "completed", needsSync: true }),
      );

      await waitForFocusedGoals(result, []);

      const value1 = await deps.settingsRepo.getValue(
        SETTINGS_KEYS.FOCUSED_GOAL_1,
      );
      expect(value1).toBe("");
    });

    it("should remove cancelled goal from focus", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);

      const { result } = renderHook(() =>
        useFocusedGoals(deps.settingsRepo, deps.goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_1]);

      // Cancel UUID_1
      await deps.goalRepo.update(
        createGoal(UUID_1, { status: "cancelled", needsSync: true }),
      );

      await waitForFocusedGoals(result, []);

      const value1 = await deps.settingsRepo.getValue(
        SETTINGS_KEYS.FOCUSED_GOAL_1,
      );
      expect(value1).toBe("");
    });

    it("should remove both goals when both become invalid", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1, UUID_2);

      const { result } = renderHook(() =>
        useFocusedGoals(deps.settingsRepo, deps.goalRepo),
      );

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      // Delete both
      await deps.goalRepo.update(
        createGoal(UUID_1, { is_deleted: true, needsSync: true }),
      );
      await deps.goalRepo.update(
        createGoal(UUID_2, { is_deleted: true, needsSync: true }),
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

      // Wait for self-healing to complete
      await waitFor(async () => {
        const value1 = await deps.settingsRepo.getValue(
          SETTINGS_KEYS.FOCUSED_GOAL_1,
        );
        const value2 = await deps.settingsRepo.getValue(
          SETTINGS_KEYS.FOCUSED_GOAL_2,
        );
        expect(value1).toBe("");
        expect(value2).toBe("");
      });
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
