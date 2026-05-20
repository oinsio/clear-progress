import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import { db } from "@/db/database";
import { buildTask } from "@/test/factories/taskFactory";
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

describe("useTasks — loading and filtering", () => {
  beforeEach(async () => {
    await clearDatabase();
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
});
