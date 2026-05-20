import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { useFocusedGoals } from "./useFocusedGoals";
import {
  expectSettingsValues,
  mockSchedulePush,
  setupFocusedGoals,
  setupFocusedGoalsTests,
  UUID_1,
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

  describe("Removing goals from focus", () => {
    it("should remove only focused goal", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        await result.current.removeGoalFromFocus(UUID_1);
      });

      await waitForFocusedGoals(result, []);

      await expectSettingsValues(deps.settingsRepo, "", "");
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should shift goal from position 2 to position 1 when removing from position 1", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_A, UUID_B);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);

      await act(async () => {
        await result.current.removeGoalFromFocus(UUID_A);
      });

      await waitForFocusedGoals(result, [UUID_B]);

      await expectSettingsValues(deps.settingsRepo, UUID_B, "");
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should remove from position 2 without shifting", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_A, UUID_B);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_A, UUID_B]);

      await act(async () => {
        await result.current.removeGoalFromFocus(UUID_B);
      });

      await waitForFocusedGoals(result, [UUID_A]);

      await expectSettingsValues(deps.settingsRepo, UUID_A, "");
      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when removing goal that is not focused", async () => {
      await setupFocusedGoals(deps.goalRepo, deps.settingsRepo, UUID_1);

      const { result } = renderHook(() => useFocusedGoals());

      await waitForFocusedGoals(result, [UUID_1]);

      await act(async () => {
        await result.current.removeGoalFromFocus(UUID_INVALID);
      });

      expect(result.current.focusedGoalIds).toEqual([UUID_1]);
      expect(mockSchedulePush).not.toHaveBeenCalled();
    });
  });
});
