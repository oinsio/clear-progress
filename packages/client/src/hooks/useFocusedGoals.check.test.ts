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
  waitForFocusedGoals,
} from "./useFocusedGoals.test-utils";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ schedulePush: mockSchedulePush }),
}));

describe("useFocusedGoals", () => {
  const deps = setupFocusedGoalsTests();

  describe("isGoalFocused", () => {
    it("should return false when goal is not focused", async () => {
      const { result } = renderHook(() => useFocusedGoals());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isGoalFocused(UUID_1)).toBe(false);
    });

    it("should return true when goal is in focused_goal_1", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      expect(result.current.isGoalFocused(UUID_1)).toBe(true);
    });

    it("should return true when goal is in focused_goal_2", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1, UUID_2);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1, UUID_2]);

      expect(result.current.isGoalFocused(UUID_2)).toBe(true);
    });
  });
});
