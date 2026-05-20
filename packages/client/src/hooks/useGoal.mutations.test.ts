import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { buildGoal } from "@/test/factories/goalFactory";
import { useGoal } from "./useGoal";
import {
  clearDatabase,
  goalService,
  mockSchedulePush,
  renderGoalHook,
  taskService,
} from "./useGoal.test-utils";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: mockSchedulePush,
    lastSyncedAt: null,
  }),
}));

describe("useGoal > mutations", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("should update goal name when updateGoal is called", async () => {
    const goal = buildGoal({ name: "Old name" });
    const result = await renderGoalHook(goal);

    await act(async () => {
      await result.current.updateGoal({ name: "New name" });
    });

    await waitFor(() => expect(result.current.goal?.name).toBe("New name"));
  });

  it("should schedule push when updateGoal is called", async () => {
    const result = await renderGoalHook(buildGoal());

    await act(async () => {
      await result.current.updateGoal({ name: "Updated" });
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should update goal status when updateGoalStatus is called", async () => {
    const goal = buildGoal({ status: "planning" });
    const result = await renderGoalHook(goal);

    await act(async () => {
      await result.current.updateGoalStatus("completed");
    });

    await waitFor(() => expect(result.current.goal?.status).toBe("completed"));
  });

  it("should schedule push when updateGoalStatus is called", async () => {
    const result = await renderGoalHook(buildGoal());

    await act(async () => {
      await result.current.updateGoalStatus("completed");
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should call softDelete when deleteGoal is called", async () => {
    const goal = buildGoal();
    const result = await renderGoalHook(goal);

    await act(async () => {
      await result.current.deleteGoal();
    });

    const deletedGoal = await db.goals.get(goal.id);
    expect(deletedGoal?.is_deleted).toBe(true);
  });

  it("should do nothing for updateGoal when goal is not loaded", async () => {
    const { result } = renderHook(() =>
      useGoal("nonexistent", goalService, taskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateGoal({ name: "New name" });
    });

    expect(mockSchedulePush).not.toHaveBeenCalled();
  });
});
