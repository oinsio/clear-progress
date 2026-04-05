import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGoal } from "./useGoal";
import { db } from "@/db/database";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { GoalService } from "@/services/GoalService";
import { TaskService } from "@/services/TaskService";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildTask } from "@/test/factories/taskFactory";

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
const taskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
);

async function renderGoalHook(goal: ReturnType<typeof buildGoal>) {
  await db.goals.add(goal);
  const { result } = renderHook(() =>
    useGoal(goal.id, goalService, taskService),
  );
  await waitFor(() => expect(result.current.goal).toBeDefined());
  return result;
}

describe("useGoal", () => {
  beforeEach(async () => {
    await db.goals.clear();
    await db.tasks.clear();
    await db.checklist_items.clear();
    mockSchedulePush.mockClear();
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

  it("should reactively update when goal is written to DB externally", async () => {
    const goal = buildGoal({ title: "Initial title" });
    await db.goals.add(goal);

    const { result } = renderHook(() =>
      useGoal(goal.id, goalService, taskService),
    );
    await waitFor(() =>
      expect(result.current.goal?.title).toBe("Initial title"),
    );

    await act(async () => {
      await db.goals.put({ ...goal, title: "Updated title" });
    });

    await waitFor(() =>
      expect(result.current.goal?.title).toBe("Updated title"),
    );
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

  it("should update goal title when updateGoal is called", async () => {
    const goal = buildGoal({ title: "Old title" });
    const result = await renderGoalHook(goal);

    await act(async () => {
      await result.current.updateGoal({ title: "New title" });
    });

    await waitFor(() => expect(result.current.goal?.title).toBe("New title"));
  });

  it("should schedule push when updateGoal is called", async () => {
    const result = await renderGoalHook(buildGoal());

    await act(async () => {
      await result.current.updateGoal({ title: "Updated" });
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
      await result.current.updateGoal({ title: "New title" });
    });

    expect(mockSchedulePush).not.toHaveBeenCalled();
  });
});
