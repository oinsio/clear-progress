import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { useFocusedGoals } from "./useFocusedGoals";
import {
  mockSchedulePush,
  setupFocusedGoals,
  setupFocusedGoalsTests,
  UUID_1,
  UUID_2,
  UUID_A,
  UUID_B,
  waitForFocusedGoals,
} from "./useFocusedGoals.test-utils";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ schedulePush: mockSchedulePush }),
}));

describe("useFocusedGoals", () => {
  const deps = setupFocusedGoalsTests();

  describe("Reading focused goals", () => {
    it("should return empty array when no goals are focused", async () => {
      const { result } = renderHook(() => useFocusedGoals());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.focusedGoalIds).toEqual([]);
    });

    it("should return one goal when focused_goal_1 is set", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitFor(() => {
        expect(result.current.focusedGoalIds).toEqual([UUID_1]);
      });
    });

    it("should return two goals when both slots are filled", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1, UUID_2);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);
    });

    it("should maintain order: focused_goal_1 first, focused_goal_2 second", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_A, UUID_B);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);
    });
  });
});
