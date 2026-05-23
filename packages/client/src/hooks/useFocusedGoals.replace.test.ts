import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
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
  UUID_C,
  UUID_INVALID,
  waitForFocusedGoals,
} from "./useFocusedGoals.test-utils";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ schedulePush: mockSchedulePush }),
}));

describe("useFocusedGoals", () => {
  const deps = setupFocusedGoalsTests();

  describe("replaceGoalInFocus", () => {
    it("should replace first goal and shift remaining to position 1", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_A, UUID_B);
      await deps.goalRepo.create(createGoal(UUID_C));

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);

      await act(async () => {
        await result.current.replaceGoalInFocus(UUID_A, UUID_C);
      });

      await waitForFocusedGoals(result, [UUID_B, UUID_C]);

      await expectSettingsValues(deps.settingsRepo, UUID_B, UUID_C);
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should replace second goal keeping first in place", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_A, UUID_B);
      await deps.goalRepo.create(createGoal(UUID_C));

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);

      await act(async () => {
        await result.current.replaceGoalInFocus(UUID_B, UUID_C);
      });

      await waitForFocusedGoals(result, [UUID_A, UUID_C]);

      await expectSettingsValues(deps.settingsRepo, UUID_A, UUID_C);
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when old goal is not focused", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        await result.current.replaceGoalInFocus(UUID_INVALID, UUID_2);
      });

      expect(result.current.focusedGoalIds).toEqual([UUID_1]);
      expect(mockSchedulePush).not.toHaveBeenCalled();
    });
  });
});
