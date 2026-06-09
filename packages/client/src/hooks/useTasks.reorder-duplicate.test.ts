import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/types/entities";
import {
  clearDatabase,
  mockSchedulePush,
  setupHookWithOneTask,
  setupHookWithTwoTasks,
} from "./useTasks.test-utils";

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

vi.mock("@/hooks/useShowHidden", () => ({
  useShowHidden: () => ({
    showHidden: false,
    toggleShowHidden: vi.fn(),
  }),
}));

describe("useTasks — reorderTasks", () => {
  beforeEach(async () => {
    await clearDatabase();
    mockSchedulePush.mockClear();
  });

  it("should update task sort_order after reordering", async () => {
    const { result, task1 } = await setupHookWithTwoTasks();

    await act(async () => {
      await result.current.reorderTasks(task1.id, "a2");
    });

    await waitFor(() => {
      const reorderedTask = result.current.tasks.find(
        (task) => task.id === task1.id,
      );
      expect(reorderedTask?.sort_order).toBe("a2");
    });
  });

  it("should schedule push when reorderTasks is called", async () => {
    const { result, task1 } = await setupHookWithTwoTasks();

    await act(async () => {
      await result.current.reorderTasks(task1.id, "a2");
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });
});

describe("useTasks — duplicateTask", () => {
  beforeEach(async () => {
    await clearDatabase();
    mockSchedulePush.mockClear();
  });

  it("should create a duplicate task with same name", async () => {
    const { result, task } = await setupHookWithOneTask({
      name: "Original task",
    });

    let duplicatedTask: Task | undefined;
    await act(async () => {
      duplicatedTask = await result.current.duplicateTask(task.id);
    });

    expect(duplicatedTask).toBeDefined();
    expect(duplicatedTask?.name).toBe("Original task");
  });

  it("should create a duplicate task with different id", async () => {
    const { result, task } = await setupHookWithOneTask();

    let duplicatedTask: Task | undefined;
    await act(async () => {
      duplicatedTask = await result.current.duplicateTask(task.id);
    });

    expect(duplicatedTask).toBeDefined();
    expect(duplicatedTask?.id).not.toBe(task.id);
  });

  it("should add duplicated task to the list", async () => {
    const { result, task } = await setupHookWithOneTask();

    await act(async () => {
      await result.current.duplicateTask(task.id);
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(2));
  });

  it("should schedule push when duplicateTask is called", async () => {
    const { result, task } = await setupHookWithOneTask();

    await act(async () => {
      await result.current.duplicateTask(task.id);
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });

  it("should return the duplicated task", async () => {
    const { result, task } = await setupHookWithOneTask({
      name: "Test task",
      box: "today",
    });

    let duplicatedTask: Task | undefined;
    await act(async () => {
      duplicatedTask = await result.current.duplicateTask(task.id);
    });

    expect(duplicatedTask).toBeDefined();
    expect(duplicatedTask?.name).toBe("Test task");
    expect(duplicatedTask?.box).toBe("today");
  });
});
