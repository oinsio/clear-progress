import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";

vi.mock("@/services/defaultServices", () => ({
  defaultTaskService: {
    getById: vi.fn(),
  },
}));

import { defaultTaskService } from "@/services/defaultServices";
import type { Task } from "@/types/entities";
import { useTaskSelection } from "./useTaskSelection";

describe("useTaskSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // FR-8: initial state should have null selection
  it("should initialize with null selectedTaskId", () => {
    const { result } = renderHook(() => useTaskSelection({ taskArrays: [] }));
    expect(result.current.selectedTaskId).toBeNull();
  });

  // FR-8: initial state should have null expandedTaskId
  it("should initialize with null expandedTaskId", () => {
    const { result } = renderHook(() => useTaskSelection({ taskArrays: [] }));
    expect(result.current.expandedTaskId).toBeNull();
  });

  // FR-8: initial state should have null selectedTask
  it("should initialize with null selectedTask", () => {
    const { result } = renderHook(() => useTaskSelection({ taskArrays: [] }));
    expect(result.current.selectedTask).toBeNull();
  });

  // FR-8: selecting a task sets selectedTaskId
  it("should set selectedTaskId when handleTaskSelect is called", () => {
    const task = buildTask();
    const { result } = renderHook(() =>
      useTaskSelection({ taskArrays: [[task]] }),
    );

    act(() => {
      result.current.handleTaskSelect(task.id);
    });

    expect(result.current.selectedTaskId).toBe(task.id);
  });

  // FR-8: selecting the same task deselects it (toggle)
  it("should deselect when handleTaskSelect is called with already-selected id", () => {
    const task = buildTask();
    const { result } = renderHook(() =>
      useTaskSelection({ taskArrays: [[task]] }),
    );

    act(() => {
      result.current.handleTaskSelect(task.id);
    });
    expect(result.current.selectedTaskId).toBe(task.id);

    act(() => {
      result.current.handleTaskSelect(task.id);
    });
    expect(result.current.selectedTaskId).toBeNull();
  });

  // FR-8: handleTaskExpand sets expandedTaskId
  it("should set expandedTaskId when handleTaskExpand is called", () => {
    const { result } = renderHook(() => useTaskSelection({ taskArrays: [] }));

    act(() => {
      result.current.handleTaskExpand("some-task-id");
    });

    expect(result.current.expandedTaskId).toBe("some-task-id");
  });

  // FR-8: handleTaskExpand accepts null to clear
  it("should clear expandedTaskId when handleTaskExpand is called with null", () => {
    const { result } = renderHook(() => useTaskSelection({ taskArrays: [] }));

    act(() => {
      result.current.handleTaskExpand("some-task-id");
    });
    act(() => {
      result.current.handleTaskExpand(null);
    });

    expect(result.current.expandedTaskId).toBeNull();
  });

  // FR-8: handleDetailPanelClose clears selectedTaskId
  it("should clear selectedTaskId when handleDetailPanelClose is called", () => {
    const task = buildTask();
    const { result } = renderHook(() =>
      useTaskSelection({ taskArrays: [[task]] }),
    );

    act(() => {
      result.current.handleTaskSelect(task.id);
    });
    expect(result.current.selectedTaskId).toBe(task.id);

    act(() => {
      result.current.handleDetailPanelClose();
    });
    expect(result.current.selectedTaskId).toBeNull();
  });

  // FR-8: selectedTask is resolved from provided arrays
  it("should resolve selectedTask from provided task arrays", async () => {
    const task = buildTask();
    const { result } = renderHook(() =>
      useTaskSelection({ taskArrays: [[task]] }),
    );

    act(() => {
      result.current.handleTaskSelect(task.id);
    });

    await waitFor(() => {
      expect(result.current.selectedTask).toEqual(task);
    });
  });

  // FR-8: selectedTask resolved from second array
  it("should resolve selectedTask from any of the provided arrays", async () => {
    const taskInFirstArray = buildTask();
    const taskInSecondArray = buildTask();
    const { result } = renderHook(() =>
      useTaskSelection({
        taskArrays: [[taskInFirstArray], [taskInSecondArray]],
      }),
    );

    act(() => {
      result.current.handleTaskSelect(taskInSecondArray.id);
    });

    await waitFor(() => {
      expect(result.current.selectedTask).toEqual(taskInSecondArray);
    });
  });

  // FR-8: selectedTask falls back to defaultTaskService.getById
  it("should fall back to defaultTaskService.getById when task not in arrays", async () => {
    const taskFromDatabase = buildTask();
    vi.mocked(defaultTaskService.getById).mockResolvedValue(taskFromDatabase);

    const { result } = renderHook(() => useTaskSelection({ taskArrays: [] }));

    act(() => {
      result.current.handleTaskSelect(taskFromDatabase.id);
    });

    await waitFor(() => {
      expect(result.current.selectedTask).toEqual(taskFromDatabase);
    });
    expect(defaultTaskService.getById).toHaveBeenCalledWith(
      taskFromDatabase.id,
    );
  });

  // FR-8: selectedTask is null when selectedTaskId is null
  it("should set selectedTask to null when selectedTaskId is cleared", async () => {
    const task = buildTask();
    const { result } = renderHook(() =>
      useTaskSelection({ taskArrays: [[task]] }),
    );

    act(() => {
      result.current.handleTaskSelect(task.id);
    });
    await waitFor(() => {
      expect(result.current.selectedTask).toEqual(task);
    });

    act(() => {
      result.current.handleDetailPanelClose();
    });
    await waitFor(() => {
      expect(result.current.selectedTask).toBeNull();
    });
  });

  // FR-8: focus mode clears selection of completed tasks
  it("should clear selection when completed task is selected in focus mode", async () => {
    const completedTask = buildTask({ is_completed: true });
    const { result } = renderHook(() =>
      useTaskSelection({
        taskArrays: [[completedTask]],
        isFocusMode: true,
      }),
    );

    act(() => {
      result.current.handleTaskSelect(completedTask.id);
    });

    await waitFor(() => {
      expect(result.current.selectedTaskId).toBeNull();
    });
  });

  // FR-8: focus mode does NOT clear selection for non-completed tasks
  it("should not clear selection for active task in focus mode", async () => {
    const activeTask = buildTask({ is_completed: false });
    const { result } = renderHook(() =>
      useTaskSelection({
        taskArrays: [[activeTask]],
        isFocusMode: true,
      }),
    );

    act(() => {
      result.current.handleTaskSelect(activeTask.id);
    });

    await waitFor(() => {
      expect(result.current.selectedTask).toEqual(activeTask);
    });
    expect(result.current.selectedTaskId).toBe(activeTask.id);
  });

  // FR-8: setSelectedTaskId is exposed for external use
  it("should expose setSelectedTaskId for external consumers", () => {
    const task = buildTask();
    const { result } = renderHook(() =>
      useTaskSelection({ taskArrays: [[task]] }),
    );

    act(() => {
      result.current.setSelectedTaskId(task.id);
    });

    expect(result.current.selectedTaskId).toBe(task.id);
  });

  // FR-8: setExpandedTaskId is exposed for external use
  it("should expose setExpandedTaskId for external consumers", () => {
    const { result } = renderHook(() => useTaskSelection({ taskArrays: [] }));

    act(() => {
      result.current.setExpandedTaskId("expanded-id");
    });

    expect(result.current.expandedTaskId).toBe("expanded-id");
  });

  // FR-8: isFocusMode defaults to false — completed task stays selected
  it("should not clear selection for completed task when isFocusMode is not provided", async () => {
    const completedTask = buildTask({ is_completed: true });
    const { result } = renderHook(() =>
      useTaskSelection({ taskArrays: [[completedTask]] }),
    );

    act(() => {
      result.current.handleTaskSelect(completedTask.id);
    });

    await waitFor(() => {
      expect(result.current.selectedTask).toEqual(completedTask);
    });
    expect(result.current.selectedTaskId).toBe(completedTask.id);
  });

  // FR-8: callbacks maintain referential stability when taskArrays change
  it("should maintain stable callback references when taskArrays change", () => {
    const taskA = buildTask();
    const taskB = buildTask();
    const callbackRefs: {
      handleTaskSelect: ((id: string) => void)[];
      handleTaskExpand: ((id: string | null) => void)[];
      handleDetailPanelClose: (() => void)[];
    } = {
      handleTaskSelect: [],
      handleTaskExpand: [],
      handleDetailPanelClose: [],
    };

    const { rerender } = renderHook(
      ({ taskArrays }: { taskArrays: Task[][] }) => {
        const hookResult = useTaskSelection({ taskArrays });
        callbackRefs.handleTaskSelect.push(hookResult.handleTaskSelect);
        callbackRefs.handleTaskExpand.push(hookResult.handleTaskExpand);
        callbackRefs.handleDetailPanelClose.push(
          hookResult.handleDetailPanelClose,
        );
        return hookResult;
      },
      { initialProps: { taskArrays: [[taskA]] } },
    );

    rerender({ taskArrays: [[taskB]] });

    // Each callback should have been captured twice (initial + rerender)
    // and both references should be identical (stable)
    expect(callbackRefs.handleTaskSelect).toHaveLength(2);
    expect(callbackRefs.handleTaskSelect[0]).toBe(
      callbackRefs.handleTaskSelect[1],
    );
    expect(callbackRefs.handleTaskExpand).toHaveLength(2);
    expect(callbackRefs.handleTaskExpand[0]).toBe(
      callbackRefs.handleTaskExpand[1],
    );
    expect(callbackRefs.handleDetailPanelClose).toHaveLength(2);
    expect(callbackRefs.handleDetailPanelClose[0]).toBe(
      callbackRefs.handleDetailPanelClose[1],
    );
  });

  // FR-8: selectedTask retains previous value when getById returns null
  it("should retain previous selectedTask when defaultTaskService.getById returns null for new selection", async () => {
    const existingTask = buildTask();
    vi.mocked(defaultTaskService.getById).mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ taskArrays }: { taskArrays: Task[][] }) =>
        useTaskSelection({ taskArrays }),
      { initialProps: { taskArrays: [[existingTask]] } },
    );

    // Select existing task — selectedTask becomes existingTask
    act(() => {
      result.current.handleTaskSelect(existingTask.id);
    });
    await waitFor(() => {
      expect(result.current.selectedTask).toEqual(existingTask);
    });

    // Remove task from arrays and set a new selectedTaskId via setSelectedTaskId
    rerender({ taskArrays: [[]] });
    act(() => {
      result.current.setSelectedTaskId("nonexistent-id");
    });

    await waitFor(() => {
      expect(defaultTaskService.getById).toHaveBeenCalledWith("nonexistent-id");
    });

    // selectedTask should retain the previous value since getById returned null
    expect(result.current.selectedTask).toEqual(existingTask);
  });
});
