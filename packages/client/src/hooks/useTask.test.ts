import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import { useTask } from "./useTask";

const mockAddAlerts = vi.fn();

vi.mock("@/app/providers/AlertProvider", () => ({
  useAlerts: () => ({
    alerts: [],
    addAlerts: mockAddAlerts,
    dismissAlerts: vi.fn(),
  }),
}));

describe("useTask", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
    mockAddAlerts.mockClear();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useTask("task-1", mockTaskService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after task is fetched", async () => {
    const { result } = renderHook(() => useTask("task-1", mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return undefined when task is not found", async () => {
    const { result } = renderHook(() =>
      useTask("nonexistent", mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.task).toBeUndefined();
  });

  it("should return the task after loading", async () => {
    const task = buildTask();
    mockTaskService = createMockTaskService({
      getById: vi.fn().mockResolvedValue(task),
    });
    const { result } = renderHook(() => useTask(task.id, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.task).toEqual(task);
  });

  it("should call getById with the given id", async () => {
    const { result } = renderHook(() => useTask("task-abc", mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getById).toHaveBeenCalledWith("task-abc");
  });

  it("should call update and refresh when updateTask is called", async () => {
    const task = buildTask();
    const updatedTask = { ...task, name: "Updated" };
    const mockGetById = vi
      .fn()
      .mockResolvedValueOnce(task)
      .mockResolvedValueOnce(updatedTask);
    mockTaskService = createMockTaskService({ getById: mockGetById });
    const { result } = renderHook(() => useTask(task.id, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateTask({ name: "Updated" });
    });

    expect(mockTaskService.update).toHaveBeenCalledWith(task.id, {
      name: "Updated",
    });
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("should call complete and refresh when completeTask is called", async () => {
    const task = buildTask();
    const mockGetById = vi.fn().mockResolvedValue(task);
    mockTaskService = createMockTaskService({ getById: mockGetById });
    const { result } = renderHook(() => useTask(task.id, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeTask();
    });

    expect(mockTaskService.complete).toHaveBeenCalledWith(
      task.id,
      expect.any(String),
    );
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("should call softDelete when deleteTask is called", async () => {
    const task = buildTask();
    mockTaskService = createMockTaskService({
      getById: vi.fn().mockResolvedValue(task),
    });
    const { result } = renderHook(() => useTask(task.id, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTask();
    });

    expect(mockTaskService.softDelete).toHaveBeenCalledWith(task.id);
  });

  it("should call moveToBox and refresh when moveTask is called", async () => {
    const task = buildTask({ box: "inbox" });
    const mockGetById = vi.fn().mockResolvedValue(task);
    mockTaskService = createMockTaskService({ getById: mockGetById });
    const { result } = renderHook(() => useTask(task.id, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveTask(BOX.TODAY);
    });

    expect(mockTaskService.moveToBox).toHaveBeenCalledWith(task.id, BOX.TODAY);
    expect(mockGetById).toHaveBeenCalledTimes(2);
  });

  it("should not call update when task is undefined", async () => {
    const { result } = renderHook(() =>
      useTask("nonexistent", mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateTask({ name: "X" });
    });

    expect(mockTaskService.update).not.toHaveBeenCalled();
  });

  it("should add alert when completing task with invalid repeat rule", async () => {
    const task = buildTask({ name: "Detail Bad Rule" });
    mockTaskService = createMockTaskService({
      getById: vi.fn().mockResolvedValue(task),
      complete: vi.fn().mockResolvedValue({
        completed: task,
        recurringResult: { status: "skipped_invalid_rule" },
      }),
    });
    const { result } = renderHook(() => useTask(task.id, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeTask();
    });

    expect(mockAddAlerts).toHaveBeenCalledWith([
      { type: "repeat_rule_invalid", taskNames: ["Detail Bad Rule"] },
    ]);
  });

  it("should not add alert when completing task with valid recurring result", async () => {
    const task = buildTask();
    mockTaskService = createMockTaskService({
      getById: vi.fn().mockResolvedValue(task),
      complete: vi.fn().mockResolvedValue({
        completed: task,
        recurringResult: { status: "not_recurring" },
      }),
    });
    const { result } = renderHook(() => useTask(task.id, mockTaskService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeTask();
    });

    expect(mockAddAlerts).not.toHaveBeenCalled();
  });
});
