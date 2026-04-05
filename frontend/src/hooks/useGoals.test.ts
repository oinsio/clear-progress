import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGoals } from "./useGoals";
import { db } from "@/db/database";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { GoalService } from "@/services/GoalService";
import { buildGoal } from "@/test/factories/goalFactory";

const mockSchedulePush = vi.fn();

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

const goalService = new GoalService(new GoalRepository());

describe("useGoals", () => {
  beforeEach(async () => {
    await db.goals.clear();
    mockSchedulePush.mockClear();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useGoals(goalService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after goals are loaded", async () => {
    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when no goals exist", async () => {
    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goals).toEqual([]);
  });

  it("should return goals after loading", async () => {
    const goal = buildGoal();
    await db.goals.add(goal);
    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.goals).toHaveLength(1));
    expect(result.current.goals[0].id).toBe(goal.id);
  });

  it("should not return deleted goals", async () => {
    await db.goals.add(buildGoal({ is_deleted: true }));
    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goals).toHaveLength(0);
  });

  it("should reactively update when a goal is written to DB externally", async () => {
    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goals).toHaveLength(0);

    await act(async () => {
      await db.goals.add(buildGoal());
    });

    await waitFor(() => expect(result.current.goals).toHaveLength(1));
  });

  it("should add goal and schedule push when createGoal is called", async () => {
    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createGoal({ title: "New goal" });
    });

    await waitFor(() => expect(result.current.goals).toHaveLength(1));
    expect(result.current.goals[0].title).toBe("New goal");
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should update goal title and schedule push when updateGoal is called", async () => {
    const goal = buildGoal({ title: "Old title" });
    await db.goals.add(goal);

    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.goals).toHaveLength(1));

    await act(async () => {
      await result.current.updateGoal(goal.id, { title: "New title" });
    });

    await waitFor(() =>
      expect(result.current.goals[0].title).toBe("New title"),
    );
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should update goal status and schedule push when updateGoalStatus is called", async () => {
    const goal = buildGoal({ status: "planning" });
    await db.goals.add(goal);

    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.goals).toHaveLength(1));

    await act(async () => {
      await result.current.updateGoalStatus(goal.id, "in_progress");
    });

    await waitFor(() =>
      expect(result.current.goals[0].status).toBe("in_progress"),
    );
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should remove goal from list and schedule push when deleteGoal is called", async () => {
    const goal = buildGoal();
    await db.goals.add(goal);

    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.goals).toHaveLength(1));

    await act(async () => {
      await result.current.deleteGoal(goal.id);
    });

    await waitFor(() => expect(result.current.goals).toHaveLength(0));
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should update goal order and schedule push when reorderGoals is called", async () => {
    const goal1 = buildGoal({ sort_order: 0 });
    const goal2 = buildGoal({ sort_order: 1 });
    await db.goals.bulkAdd([goal1, goal2]);

    const { result } = renderHook(() => useGoals(goalService));
    await waitFor(() => expect(result.current.goals).toHaveLength(2));

    await act(async () => {
      await result.current.reorderGoals([goal2, goal1]);
    });

    await waitFor(() => expect(result.current.goals[0].id).toBe(goal2.id));
    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });
});
