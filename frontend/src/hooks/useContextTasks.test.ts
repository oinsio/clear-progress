import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContextTasks } from "./useContextTasks";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";

describe("useContextTasks", () => {
  let mockTaskService: TaskService;
  const contextId = "ctx-1";
  let testTask: ReturnType<typeof buildTask>;

  const renderContextTasksHook = (
    ctxId = contextId,
    service = mockTaskService,
  ) => renderHook(() => useContextTasks(ctxId, service));

  beforeEach(() => {
    testTask = buildTask({ context_id: contextId });
    mockTaskService = createMockTaskService({
      getByContextId: vi.fn().mockResolvedValue([testTask]),
    });
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderContextTasksHook();
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are fetched", async () => {
    const { result } = renderContextTasksHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return empty array when context has no tasks", async () => {
    mockTaskService = createMockTaskService();
    const { result } = renderContextTasksHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("should call getByContextId with the given contextId", async () => {
    const { result } = renderContextTasksHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getByContextId).toHaveBeenCalledWith(contextId);
  });

  it("should return context tasks after loading", async () => {
    const { result } = renderContextTasksHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([testTask]);
  });

  it("should call create with context_id when createTask is called", async () => {
    const mockGetByContextId = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({
      getByContextId: mockGetByContextId,
    });
    const { result } = renderContextTasksHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("New task", BOX.TODAY);
    });

    expect(mockTaskService.create).toHaveBeenCalledWith({
      name: "New task",
      box: BOX.TODAY,
      description: "",
      context_id: contextId,
    });
  });

  it("should call softDelete when deleteTask is called", async () => {
    const { result } = renderContextTasksHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteTask(testTask.id);
    });

    expect(mockTaskService.softDelete).toHaveBeenCalledWith(testTask.id);
  });

  it("should call moveToBox when moveTask is called", async () => {
    const { result } = renderContextTasksHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveTask(testTask.id, BOX.WEEK);
    });

    expect(mockTaskService.moveToBox).toHaveBeenCalledWith(
      testTask.id,
      BOX.WEEK,
    );
  });

  it("should call update when updateTask is called", async () => {
    const { result } = renderContextTasksHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateTask(testTask.id, { name: "Updated" });
    });

    expect(mockTaskService.update).toHaveBeenCalledWith(testTask.id, {
      name: "Updated",
    });
  });

  it("should have empty initial tasks before loading completes", () => {
    mockTaskService = createMockTaskService({
      getByContextId: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderContextTasksHook();
    expect(result.current.tasks).toEqual([]);
  });

  it("should create task with updated contextId after contextId changes", async () => {
    const mockGetByContextId = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({
      getByContextId: mockGetByContextId,
    });
    const { result, rerender } = renderHook(
      ({ ctxId }: { ctxId: string }) => useContextTasks(ctxId, mockTaskService),
      { initialProps: { ctxId: "ctx-1" } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ ctxId: "ctx-2" });
    await waitFor(() =>
      expect(mockTaskService.getByContextId).toHaveBeenCalledWith("ctx-2"),
    );

    await act(async () => {
      await result.current.createTask("New task", BOX.TODAY);
    });

    expect(mockTaskService.create).toHaveBeenCalledWith({
      name: "New task",
      box: BOX.TODAY,
      description: "",
      context_id: "ctx-2",
    });
  });

  it("should refetch when contextId changes", async () => {
    const { rerender } = renderHook(
      ({ ctxId }: { ctxId: string }) => useContextTasks(ctxId, mockTaskService),
      { initialProps: { ctxId: "ctx-1" } },
    );
    await waitFor(() =>
      expect(mockTaskService.getByContextId).toHaveBeenCalledWith("ctx-1"),
    );

    rerender({ ctxId: "ctx-2" });
    await waitFor(() =>
      expect(mockTaskService.getByContextId).toHaveBeenCalledWith("ctx-2"),
    );
  });
});
