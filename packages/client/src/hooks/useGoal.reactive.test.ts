import { act, renderHook, waitFor } from "@testing-library/react";
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

describe("useGoal > reactive updates", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("should reactively update when goal is written to DB externally", async () => {
    const goal = buildGoal({ name: "Initial name" });
    await db.goals.add(goal);

    const { result } = renderHook(() =>
      useGoal(goal.id, goalService, taskService),
    );
    await waitFor(() => expect(result.current.goal?.name).toBe("Initial name"));

    await act(async () => {
      await db.goals.put({ ...goal, name: "Updated name" });
    });

    await waitFor(() => expect(result.current.goal?.name).toBe("Updated name"));
  });

  it("should reactively update when task linked to goal is added externally", async () => {
    const goal = buildGoal();
    await db.goals.add(goal);

    const { result } = renderHook(() =>
      useGoal(goal.id, goalService, taskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toHaveLength(0);

    await act(async () => {
      await db.tasks.add(buildTask({ goal_id: goal.id }));
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
  });
});
