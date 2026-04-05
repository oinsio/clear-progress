import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCompletedTasks } from "./useCompletedTasks";
import { db } from "@/db/database";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: vi.fn(),
    lastSyncedAt: null,
  }),
}));

const taskService = new TaskService(new TaskRepository(), new ChecklistRepository());

describe("useCompletedTasks", () => {
  beforeEach(async () => {
    await db.tasks.clear();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useCompletedTasks(taskService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are loaded", async () => {
    const { result } = renderHook(() => useCompletedTasks(taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when no completed tasks exist", async () => {
    const { result } = renderHook(() => useCompletedTasks(taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.completedTasks).toEqual([]);
  });

  it("should return completed tasks after loading", async () => {
    const completedTask = buildTask({ is_completed: true, completed_at: "2025-01-01T10:00:00.000Z" });
    const activeTask = buildTask({ is_completed: false });
    await db.tasks.bulkAdd([completedTask, activeTask]);

    const { result } = renderHook(() => useCompletedTasks(taskService));
    await waitFor(() => expect(result.current.completedTasks).toHaveLength(1));
    expect(result.current.completedTasks[0].id).toBe(completedTask.id);
  });

  it("should not return active tasks", async () => {
    await db.tasks.add(buildTask({ is_completed: false }));

    const { result } = renderHook(() => useCompletedTasks(taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.completedTasks).toHaveLength(0);
  });

  it("should not return deleted completed tasks", async () => {
    await db.tasks.add(buildTask({ is_completed: true, is_deleted: true }));

    const { result } = renderHook(() => useCompletedTasks(taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.completedTasks).toHaveLength(0);
  });

  it("should reactively update when a completed task is written to DB externally", async () => {
    const { result } = renderHook(() => useCompletedTasks(taskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.completedTasks).toHaveLength(0);

    await act(async () => {
      await db.tasks.add(buildTask({ is_completed: true, completed_at: "2025-01-01T10:00:00.000Z" }));
    });

    await waitFor(() => expect(result.current.completedTasks).toHaveLength(1));
  });
});
