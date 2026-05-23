import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { buildGoal } from "@/test/factories/goalFactory";
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

describe("useGoal > loading", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() =>
      useGoal("goal-1", goalService, taskService),
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after data is loaded", async () => {
    const { result } = renderHook(() =>
      useGoal("goal-1", goalService, taskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return undefined goal when not found", async () => {
    const { result } = renderHook(() =>
      useGoal("nonexistent", goalService, taskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goal).toBeUndefined();
  });

  it("should return goal after loading", async () => {
    const goal = buildGoal();
    await db.goals.add(goal);

    const { result } = renderHook(() =>
      useGoal(goal.id, goalService, taskService),
    );
    await waitFor(() => expect(result.current.goal).toBeDefined());
    expect(result.current.goal?.id).toBe(goal.id);
  });
});
