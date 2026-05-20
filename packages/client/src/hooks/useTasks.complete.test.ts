import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import { useTasks } from "./useTasks";
import {
  clearDatabase,
  mockSchedulePush,
  setupHookWithOneTask,
  taskService,
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

describe("useTasks — completeTask", () => {
  beforeEach(async () => {
    await clearDatabase();
    mockSchedulePush.mockClear();
  });

  it("should mark task as completed when completeTask is called on incomplete task", async () => {
    const { result, task } = await setupHookWithOneTask({
      is_completed: false,
    });

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    await waitFor(() =>
      expect(result.current.tasks[0].is_completed).toBe(true),
    );
  });

  it("should mark task as incomplete when completeTask is called on completed task", async () => {
    const { result, task } = await setupHookWithOneTask({ is_completed: true });

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    await waitFor(() =>
      expect(result.current.tasks[0].is_completed).toBe(false),
    );
  });

  it("should return null from completeTask when task has no repeat_rule", async () => {
    const { result, task } = await setupHookWithOneTask({
      is_completed: false,
      repeat_rule: "",
    });

    let recurringId: string | null = "placeholder";
    await act(async () => {
      recurringId = await result.current.completeTask(task.id);
    });

    expect(recurringId).toBeNull();
  });

  it("should not return recurring task id when task creates hidden copy", async () => {
    const { result, task } = await setupHookWithOneTask({
      is_completed: false,
      repeat_rule: JSON.stringify({
        type: "fixed",
        frequency: "daily",
        interval: 1,
        target_box: "today",
        advance_days: 0,
      }),
    });

    let recurringId: string | null = null;
    await act(async () => {
      recurringId = await result.current.completeTask(task.id);
    });

    expect(recurringId).toBeNull();
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
    const { result, task } = await setupHookWithOneTask({
      is_completed: false,
    });

    await act(async () => {
      await result.current.completeTask(task.id);
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });
});
