import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { useGoal } from "./useGoal";
import {
  clearDatabase,
  goalService,
  mockSchedulePush,
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

describe("useGoal > tasks", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("should return tasks linked to the goal", async () => {
    const goal = buildGoal();
    await db.goals.add(goal);
    const task1 = buildTask({ goal_id: goal.id });
    const task2 = buildTask({ goal_id: goal.id });
    await db.tasks.bulkAdd([task1, task2]);

    const { result } = renderHook(() =>
      useGoal(goal.id, goalService, taskService),
    );
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));
  });

  it("should not return tasks from other goals", async () => {
    const goal = buildGoal();
    await db.goals.add(goal);
    await db.tasks.add(buildTask({ goal_id: "other-goal-id" }));

    const { result } = renderHook(() =>
      useGoal(goal.id, goalService, taskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toHaveLength(0);
  });
});
