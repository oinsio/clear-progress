import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { SETTINGS_KEYS } from "@clear-progress/contract";
import { useFocusedGoals } from "./useFocusedGoals";
import {
  createGoal,
  mockSchedulePush,
  setupFocusedGoals,
  setupFocusedGoalsTests,
  UUID_1,
  UUID_2,
  UUID_3,
  waitForFocusedGoals,
} from "./useFocusedGoals.test-utils";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ schedulePush: mockSchedulePush }),
}));

describe("useFocusedGoals", () => {
  const deps = setupFocusedGoalsTests();

  describe("Adding goals to focus", () => {
    it("should add first goal to focused_goal_1", async () => {
      await deps.goalRepo.create(createGoal(UUID_1));

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

      const value = await deps.settingsRepo.getValue(
        SETTINGS_KEYS.FOCUSED_GOAL_1,
      );
      expect(value).toBe(UUID_1);
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should add second goal to focused_goal_2", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);
      await deps.goalRepo.create(createGoal(UUID_2));

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        const status = await result.current.addGoalToFocus(UUID_2);
        expect(status).toBe("added");
      });

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      const value = await deps.settingsRepo.getValue(
        SETTINGS_KEYS.FOCUSED_GOAL_2,
      );
      expect(value).toBe(UUID_2);
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should return 'limit_reached' when trying to add third goal", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1, UUID_2);
      await deps.goalRepo.create(createGoal(UUID_3));

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
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);

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
});
