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

vi.mock("@/app/providers/AlertProvider", () => ({
  useAlerts: () => ({
    alerts: [],
    addAlerts: vi.fn(),
    dismissAlerts: vi.fn(),
  }),
}));

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

describe("useTasks — create, delete, move, update", () => {
  beforeEach(async () => {
    await clearDatabase();
    mockSchedulePush.mockClear();
  });

  it("should add task and show it in list when createTask is called", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("New task");
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    expect(result.current.tasks[0].name).toBe("New task");
  });

  it("should schedule push when createTask is called", async () => {
    const { result } = renderHook(() => useTasks(BOX.TODAY, taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("New task");
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

  it("should update task name when updateTask is called", async () => {
    const { result, task } = await setupHookWithOneTask({ name: "Old name" });

    await act(async () => {
      await result.current.updateTask(task.id, { name: "New name" });
    });

    await waitFor(() => expect(result.current.tasks[0].name).toBe("New name"));
  });

  it("should schedule push when updateTask is called", async () => {
    const { result, task } = await setupHookWithOneTask();

    await act(async () => {
      await result.current.updateTask(task.id, {
        description: "updated description",
      });
    });

    expect(mockSchedulePush).toHaveBeenCalledTimes(1);
  });
});
