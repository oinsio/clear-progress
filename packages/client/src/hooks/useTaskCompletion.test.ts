import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTaskCompletion } from "./useTaskCompletion";

describe("useTaskCompletion", () => {
  const TASK_ID = "task-abc-123";
  const RECURRING_TASK_ID = "recurring-xyz-456";
  const OTHER_TASK_ID = "other-task-789";

  let completeFn: ReturnType<typeof vi.fn>;
  let setSelectedTaskId: ReturnType<typeof vi.fn>;
  let setExpandedTaskId: ReturnType<typeof vi.fn>;
  let afterComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    completeFn = vi.fn().mockResolvedValue(undefined);
    setSelectedTaskId = vi.fn();
    setExpandedTaskId = vi.fn();
    afterComplete = vi.fn().mockResolvedValue(undefined);
  });

  // FR-9: calls the completion function with the task id
  it("should call completeFn with the given task id", async () => {
    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: null,
        expandedTaskId: null,
        setSelectedTaskId,
        setExpandedTaskId,
      }),
    );

    await act(() => result.current(TASK_ID));

    expect(completeFn).toHaveBeenCalledWith(TASK_ID);
  });

  // FR-9: completing a recurring task selects new instance
  it("should set selectedTaskId to recurring id when completeFn returns one", async () => {
    completeFn.mockResolvedValue(RECURRING_TASK_ID);

    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: TASK_ID,
        expandedTaskId: null,
        setSelectedTaskId,
        setExpandedTaskId,
      }),
    );

    await act(() => result.current(TASK_ID));

    expect(setSelectedTaskId).toHaveBeenCalledWith(RECURRING_TASK_ID);
  });

  // FR-9: completing a non-recurring selected task clears selection
  it("should clear selectedTaskId when completed task was selected and not recurring", async () => {
    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: TASK_ID,
        expandedTaskId: null,
        setSelectedTaskId,
        setExpandedTaskId,
      }),
    );

    await act(() => result.current(TASK_ID));

    expect(setSelectedTaskId).toHaveBeenCalledWith(null);
  });

  // FR-9: completing a non-selected task preserves selection
  it("should not change selectedTaskId when completed task was not selected", async () => {
    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: OTHER_TASK_ID,
        expandedTaskId: null,
        setSelectedTaskId,
        setExpandedTaskId,
      }),
    );

    await act(() => result.current(TASK_ID));

    expect(setSelectedTaskId).not.toHaveBeenCalled();
  });

  // FR-9: completing an expanded task clears expansion
  it("should clear expandedTaskId when completed task was expanded", async () => {
    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: null,
        expandedTaskId: TASK_ID,
        setSelectedTaskId,
        setExpandedTaskId,
      }),
    );

    await act(() => result.current(TASK_ID));

    expect(setExpandedTaskId).toHaveBeenCalledWith(null);
  });

  // FR-9: completing a non-expanded task does not clear expansion
  it("should not change expandedTaskId when completed task was not expanded", async () => {
    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: null,
        expandedTaskId: OTHER_TASK_ID,
        setSelectedTaskId,
        setExpandedTaskId,
      }),
    );

    await act(() => result.current(TASK_ID));

    expect(setExpandedTaskId).not.toHaveBeenCalled();
  });

  // FR-9: afterComplete callback is called after completion
  it("should call afterComplete callback when provided", async () => {
    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: null,
        expandedTaskId: null,
        setSelectedTaskId,
        setExpandedTaskId,
        afterComplete,
      }),
    );

    await act(() => result.current(TASK_ID));

    expect(afterComplete).toHaveBeenCalled();
  });

  // FR-9: afterComplete is optional
  it("should not throw when afterComplete is not provided", async () => {
    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: null,
        expandedTaskId: null,
        setSelectedTaskId,
        setExpandedTaskId,
      }),
    );

    await expect(act(() => result.current(TASK_ID))).resolves.not.toThrow();
  });

  // FR-9: callback reflects updated selectedTaskId on re-render
  it("should use latest selectedTaskId when dependency changes", async () => {
    const { result, rerender } = renderHook(
      ({ selectedTaskId }) =>
        useTaskCompletion({
          completeFn,
          selectedTaskId,
          expandedTaskId: null,
          setSelectedTaskId,
          setExpandedTaskId,
        }),
      { initialProps: { selectedTaskId: OTHER_TASK_ID } },
    );

    // Re-render with selectedTaskId matching the task we will complete
    rerender({ selectedTaskId: TASK_ID });

    await act(() => result.current(TASK_ID));

    // Should clear because selectedTaskId now matches
    expect(setSelectedTaskId).toHaveBeenCalledWith(null);
  });

  // FR-9: recurring task with expansion clears both correctly
  it("should set selectedTaskId to recurring id and clear expandedTaskId when both match", async () => {
    completeFn.mockResolvedValue(RECURRING_TASK_ID);

    const { result } = renderHook(() =>
      useTaskCompletion({
        completeFn,
        selectedTaskId: TASK_ID,
        expandedTaskId: TASK_ID,
        setSelectedTaskId,
        setExpandedTaskId,
      }),
    );

    await act(() => result.current(TASK_ID));

    expect(setSelectedTaskId).toHaveBeenCalledWith(RECURRING_TASK_ID);
    expect(setExpandedTaskId).toHaveBeenCalledWith(null);
  });
});
