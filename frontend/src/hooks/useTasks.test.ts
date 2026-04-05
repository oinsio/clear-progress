import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTasks } from "./useTasks";
import { db } from "@/db/database";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";

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

const taskService = new TaskService(new TaskRepository(), new ChecklistRepository());

async function setupHookWithOneTask(overrides: Parameters<typeof buildTask>[0] = {}) {
  const task = buildTask({ box: "today", ...overrides });
  await db.tasks.add(task);
  const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
  await waitFor(() => expect(result.current.tasks).toHaveLength(1));
  return { result, task };
}

async function setupHookWithTwoTasks() {
  const task1 = buildTask({ box: "today", sort_order: 0 });
  const task2 = buildTask({ box: "today", sort_order: 1 });
  await db.tasks.bulkAdd([task1, task2]);
  const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
  await waitFor(() => expect(result.current.tasks).toHaveLength(2));
  return { result, task1, task2 };
}

describe("useTasks", () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
    mockSchedulePush.mockClear();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are loaded", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when box has no tasks", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("should return tasks from the correct box", async () => {
    const { result, task } = await setupHookWithOneTask();
    expect(result.current.tasks[0].id).toBe(task.id);
  });

  it("should not return tasks from other boxes", async () => {
    await db.tasks.add(buildTask({ box: "inbox" }));
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toHaveLength(0);
  });

  it("should not return deleted tasks", async () => {
    await db.tasks.add(buildTask({ box: "today", is_deleted: true }));
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toHaveLength(0);
  });

  it("should reactively update when a task is written to DB externally", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toHaveLength(0);

    await act(async () => {
      const task = buildTask({ box: "today" });
      await db.tasks.add(task);
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
  });

  it("should add task and show it in list when createTask is called", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("New task");
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    expect(result.current.tasks[0].title).toBe("New task");
  });

  it("should schedule push when createTask is called", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("New task");
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should mark task as completed when completeTask is called on incomplete task", async () => {
    const { result, task } = await setupHookWithOneTask({ is_completed: false });

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    await waitFor(() => expect(result.current.tasks[0].is_completed).toBe(true));
  });

  it("should mark task as incomplete when completeTask is called on completed task", async () => {
    const { result, task } = await setupHookWithOneTask({ is_completed: true });

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    await waitFor(() => expect(result.current.tasks[0].is_completed).toBe(false));
  });

  it("should return null from completeTask when task has no repeat_rule", async () => {
    const { result, task } = await setupHookWithOneTask({ is_completed: false, repeat_rule: "" });

    let recurringId: string | null = "placeholder";
    await act(async () => {
      recurringId = await result.current.completeTask(task.id);
    });

    expect(recurringId).toBeNull();
  });

  it("should return recurring task id when task has repeat_rule", async () => {
    const { result, task } = await setupHookWithOneTask({ is_completed: false, repeat_rule: "daily" });

    let recurringId: string | null = null;
    await act(async () => {
      recurringId = await result.current.completeTask(task.id);
    });

    expect(recurringId).not.toBeNull();
  });

  it("should return null when completeTask called for nonexistent task", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let recurringId: string | null = "placeholder";
    await act(async () => {
      recurringId = await result.current.completeTask("nonexistent-id");
    });

    expect(recurringId).toBeNull();
  });

  it("should schedule push when completeTask is called", async () => {
    const { result, task } = await setupHookWithOneTask({ is_completed: false });

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should remove task from list when deleteTask is called", async () => {
    const { result, task } = await setupHookWithOneTask();

    await act(async () => {
      await result.current.deleteTask(task.id);
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(0));
  });

  it("should schedule push when deleteTask is called", async () => {
    const { result, task } = await setupHookWithOneTask();

    await act(async () => {
      await result.current.deleteTask(task.id);
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should move task to different box when moveTask is called", async () => {
    const { result, task } = await setupHookWithOneTask();

    await act(async () => {
      await result.current.moveTask(task.id, BOX.WEEK);
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(0));
  });

  it("should schedule push when moveTask is called", async () => {
    const { result, task } = await setupHookWithOneTask();

    await act(async () => {
      await result.current.moveTask(task.id, BOX.WEEK);
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should update task title when updateTask is called", async () => {
    const { result, task } = await setupHookWithOneTask({ title: "Old title" });

    await act(async () => {
      await result.current.updateTask(task.id, { title: "New title" });
    });

    await waitFor(() => expect(result.current.tasks[0].title).toBe("New title"));
  });

  it("should schedule push when updateTask is called", async () => {
    const { result, task } = await setupHookWithOneTask();

    await act(async () => {
      await result.current.updateTask(task.id, { notes: "updated notes" });
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  describe("reorderTasks", () => {
    it("should update task order after reordering", async () => {
      const { result, task1, task2 } = await setupHookWithTwoTasks();

      await act(async () => {
        await result.current.reorderTasks([task2, task1]);
      });

      await waitFor(() => expect(result.current.tasks[0].id).toBe(task2.id));
    });

    it("should schedule push when reorderTasks is called", async () => {
      const { result, task1, task2 } = await setupHookWithTwoTasks();

      await act(async () => {
        await result.current.reorderTasks([task2, task1]);
      });

      expect(mockSchedulePush).toHaveBeenCalledTimes(1);
    });
  });
});
