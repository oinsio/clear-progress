import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import type { UseTasksReturn } from "@/hooks/useTasks";
import { buildTasksHook } from "@/test/builders/hookBuilders";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { useActiveTaskHandlers } from "./useActiveTaskHandlers";

describe("useActiveTaskHandlers", () => {
  let today: UseTasksReturn;
  let week: UseTasksReturn;
  let later: UseTasksReturn;
  let setSelectedTaskId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    today = buildTasksHook();
    week = buildTasksHook();
    later = buildTasksHook();
    setSelectedTaskId = vi.fn();
  });

  function renderHandlers(
    overrides: {
      todayTasks?: Task[];
      weekTasks?: Task[];
      laterTasks?: Task[];
      selectedTask?: Task | null;
    } = {},
  ) {
    if (overrides.todayTasks)
      today = buildTasksHook({ tasks: overrides.todayTasks });
    if (overrides.weekTasks)
      week = buildTasksHook({ tasks: overrides.weekTasks });
    if (overrides.laterTasks)
      later = buildTasksHook({ tasks: overrides.laterTasks });

    return renderHook(() =>
      useActiveTaskHandlers({
        today,
        week,
        later,
        selectedTask: overrides.selectedTask ?? null,
        setSelectedTaskId,
      }),
    );
  }

  // FR2: returns all four handler functions
  it("should return handleMoveTask, handleUpdateTask, handleDuplicateTask, handleDeleteTask", () => {
    const { result } = renderHandlers();
    expect(result.current.handleMoveTask).toBeInstanceOf(Function);
    expect(result.current.handleUpdateTask).toBeInstanceOf(Function);
    expect(result.current.handleDuplicateTask).toBeInstanceOf(Function);
    expect(result.current.handleDeleteTask).toBeInstanceOf(Function);
  });

  describe("handleMoveTask", () => {
    // FR2: moves a today task to week via today.moveTask
    it("should call today.moveTask when task is in today box", async () => {
      const task = buildTask({ box: BOX.TODAY });
      const { result } = renderHandlers({ todayTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.WEEK));

      expect(today.moveTask).toHaveBeenCalledWith(task.id, BOX.WEEK);
    });

    // FR2: finds correct task by id when multiple tasks from different boxes (kills find(() => true))
    it("should find correct task by id among tasks from different boxes", async () => {
      const todayTask = buildTask({ box: BOX.TODAY });
      const weekTask = buildTask({ box: BOX.WEEK });
      const { result } = renderHandlers({
        todayTasks: [todayTask],
        weekTasks: [weekTask],
      });

      await act(() => result.current.handleMoveTask(weekTask.id, BOX.LATER));

      expect(week.moveTask).toHaveBeenCalledWith(weekTask.id, BOX.LATER);
      expect(today.moveTask).not.toHaveBeenCalled();
    });

    // FR2: moves a week task via week.moveTask
    it("should call week.moveTask when task is in week box", async () => {
      const task = buildTask({ box: BOX.WEEK });
      const { result } = renderHandlers({ weekTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.TODAY));

      expect(week.moveTask).toHaveBeenCalledWith(task.id, BOX.TODAY);
    });

    // FR2: moves a later task via later.moveTask
    it("should call later.moveTask when task is in later box", async () => {
      const task = buildTask({ box: BOX.LATER });
      const { result } = renderHandlers({ laterTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.TODAY));

      expect(later.moveTask).toHaveBeenCalledWith(task.id, BOX.TODAY);
    });

    // FR2: reloads all boxes after move
    it("should reload all boxes after moving a task", async () => {
      const task = buildTask({ box: BOX.TODAY });
      const { result } = renderHandlers({ todayTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.WEEK));

      expect(today.reload).toHaveBeenCalled();
      expect(week.reload).toHaveBeenCalled();
      expect(later.reload).toHaveBeenCalled();
    });

    // FR2: does nothing when task is not found
    it("should not call any moveTask when task id is not found", async () => {
      const { result } = renderHandlers();

      await act(() => result.current.handleMoveTask("nonexistent", BOX.WEEK));

      expect(today.moveTask).not.toHaveBeenCalled();
      expect(week.moveTask).not.toHaveBeenCalled();
      expect(later.moveTask).not.toHaveBeenCalled();
    });

    // FR2: inbox tasks use today.moveTask
    it("should call today.moveTask when task is in inbox box", async () => {
      const task = buildTask({ box: BOX.INBOX });
      const { result } = renderHandlers({ todayTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.WEEK));

      expect(today.moveTask).toHaveBeenCalledWith(task.id, BOX.WEEK);
    });
  });

  describe("handleUpdateTask", () => {
    // FR2: updates a today task via today.updateTask
    it("should call today.updateTask when task is in today box", async () => {
      const task = buildTask({ box: BOX.TODAY });
      const { result } = renderHandlers({ todayTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { name: "Updated" }),
      );

      expect(today.updateTask).toHaveBeenCalledWith(task.id, {
        name: "Updated",
      });
    });

    // FR2: finds correct task by id for update (kills find(() => true))
    it("should find correct task by id among tasks from different boxes for update", async () => {
      const todayTask = buildTask({ box: BOX.TODAY });
      const weekTask = buildTask({ box: BOX.WEEK });
      const { result } = renderHandlers({
        todayTasks: [todayTask],
        weekTasks: [weekTask],
      });

      await act(() =>
        result.current.handleUpdateTask(weekTask.id, { name: "Updated" }),
      );

      expect(week.updateTask).toHaveBeenCalledWith(weekTask.id, {
        name: "Updated",
      });
      expect(today.updateTask).not.toHaveBeenCalled();
    });

    // FR2: updates a week task via week.updateTask
    it("should call week.updateTask when task is in week box", async () => {
      const task = buildTask({ box: BOX.WEEK });
      const { result } = renderHandlers({ weekTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { name: "Updated" }),
      );

      expect(week.updateTask).toHaveBeenCalledWith(task.id, {
        name: "Updated",
      });
    });

    // FR2: updates a later task via later.updateTask
    it("should call later.updateTask when task is in later box", async () => {
      const task = buildTask({ box: BOX.LATER });
      const { result } = renderHandlers({ laterTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { name: "Updated" }),
      );

      expect(later.updateTask).toHaveBeenCalledWith(task.id, {
        name: "Updated",
      });
    });

    // FR2: delegates to handleMoveTask when changes.box differs from task.box
    it("should call handleMoveTask when changes contain a different box", async () => {
      const task = buildTask({ box: BOX.TODAY });
      const { result } = renderHandlers({ todayTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { box: BOX.WEEK }),
      );

      expect(today.moveTask).toHaveBeenCalledWith(task.id, BOX.WEEK);
      expect(today.updateTask).not.toHaveBeenCalled();
    });

    // FR2: does not move when changes.box matches task.box
    it("should call updateTask when changes.box matches task.box", async () => {
      const task = buildTask({ box: BOX.TODAY });
      const { result } = renderHandlers({ todayTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { box: BOX.TODAY }),
      );

      expect(today.updateTask).toHaveBeenCalledWith(task.id, {
        box: BOX.TODAY,
      });
      expect(today.moveTask).not.toHaveBeenCalled();
    });

    // FR2: does nothing when task is not found
    it("should not call any update when task id is not found", async () => {
      const { result } = renderHandlers();

      await act(() =>
        result.current.handleUpdateTask("nonexistent", { name: "X" }),
      );

      expect(today.updateTask).not.toHaveBeenCalled();
      expect(week.updateTask).not.toHaveBeenCalled();
      expect(later.updateTask).not.toHaveBeenCalled();
    });
  });

  describe("handleDuplicateTask", () => {
    // FR2: duplicates a today task via today.duplicateTask
    it("should call today.duplicateTask when task is in today box", async () => {
      const task = buildTask({ box: BOX.TODAY });
      const newTask = buildTask({ box: BOX.TODAY });
      today = buildTasksHook({
        tasks: [task],
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      const { result } = renderHook(() =>
        useActiveTaskHandlers({
          today,
          week,
          later,
          selectedTask: null,
          setSelectedTaskId,
        }),
      );

      await act(() => result.current.handleDuplicateTask(task.id));

      expect(today.duplicateTask).toHaveBeenCalledWith(task.id);
      expect(setSelectedTaskId).toHaveBeenCalledWith(newTask.id);
    });

    // FR2: duplicates a week task via week.duplicateTask
    it("should call week.duplicateTask when task is in week box", async () => {
      const task = buildTask({ box: BOX.WEEK });
      const newTask = buildTask({ box: BOX.WEEK });
      week = buildTasksHook({
        tasks: [task],
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      const { result } = renderHook(() =>
        useActiveTaskHandlers({
          today,
          week,
          later,
          selectedTask: null,
          setSelectedTaskId,
        }),
      );

      await act(() => result.current.handleDuplicateTask(task.id));

      expect(week.duplicateTask).toHaveBeenCalledWith(task.id);
      expect(setSelectedTaskId).toHaveBeenCalledWith(newTask.id);
    });

    // FR2: duplicates a later task via later.duplicateTask
    it("should call later.duplicateTask when task is in later box", async () => {
      const task = buildTask({ box: BOX.LATER });
      const newTask = buildTask({ box: BOX.LATER });
      later = buildTasksHook({
        tasks: [task],
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      const { result } = renderHook(() =>
        useActiveTaskHandlers({
          today,
          week,
          later,
          selectedTask: null,
          setSelectedTaskId,
        }),
      );

      await act(() => result.current.handleDuplicateTask(task.id));

      expect(later.duplicateTask).toHaveBeenCalledWith(task.id);
      expect(setSelectedTaskId).toHaveBeenCalledWith(newTask.id);
    });

    // FR2: finds correct task by id for duplicate (kills find(() => true))
    it("should find correct task by id among tasks from different boxes for duplicate", async () => {
      const todayTask = buildTask({ box: BOX.TODAY });
      const weekTask = buildTask({ box: BOX.WEEK });
      const newTask = buildTask({ box: BOX.WEEK });
      week = buildTasksHook({
        tasks: [weekTask],
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      today = buildTasksHook({ tasks: [todayTask] });
      const { result } = renderHook(() =>
        useActiveTaskHandlers({
          today,
          week,
          later,
          selectedTask: null,
          setSelectedTaskId,
        }),
      );

      await act(() => result.current.handleDuplicateTask(weekTask.id));

      expect(week.duplicateTask).toHaveBeenCalledWith(weekTask.id);
      expect(today.duplicateTask).not.toHaveBeenCalled();
    });

    // FR2: does nothing when task is not found
    it("should not call duplicateTask when task id is not found", async () => {
      const { result } = renderHandlers();

      await act(() => result.current.handleDuplicateTask("nonexistent"));

      expect(today.duplicateTask).not.toHaveBeenCalled();
      expect(week.duplicateTask).not.toHaveBeenCalled();
      expect(later.duplicateTask).not.toHaveBeenCalled();
    });
  });

  describe("handleDeleteTask", () => {
    // FR2: deletes via today.deleteTask when selectedTask is in today
    it("should call today.deleteTask when selected task is in today box", () => {
      const task = buildTask({ box: BOX.TODAY });
      const { result } = renderHandlers({ selectedTask: task });

      act(() => result.current.handleDeleteTask(task.id));

      expect(today.deleteTask).toHaveBeenCalledWith(task.id);
      expect(setSelectedTaskId).toHaveBeenCalledWith(null);
    });

    // FR2: deletes via week.deleteTask when selectedTask is in week
    it("should call week.deleteTask when selected task is in week box", () => {
      const task = buildTask({ box: BOX.WEEK });
      const { result } = renderHandlers({ selectedTask: task });

      act(() => result.current.handleDeleteTask(task.id));

      expect(week.deleteTask).toHaveBeenCalledWith(task.id);
    });

    // FR2: deletes via later.deleteTask when selectedTask is in later
    it("should call later.deleteTask when selected task is in later box", () => {
      const task = buildTask({ box: BOX.LATER });
      const { result } = renderHandlers({ selectedTask: task });

      act(() => result.current.handleDeleteTask(task.id));

      expect(later.deleteTask).toHaveBeenCalledWith(task.id);
    });

    // FR2: clears selection before deleting
    it("should set selectedTaskId to null before deleting", () => {
      const task = buildTask({ box: BOX.TODAY });
      const { result } = renderHandlers({ selectedTask: task });

      act(() => result.current.handleDeleteTask(task.id));

      expect(setSelectedTaskId).toHaveBeenCalledWith(null);
    });

    // FR2: does nothing when no selectedTask
    it("should not call any deleteTask when selectedTask is null", () => {
      const { result } = renderHandlers({ selectedTask: null });

      act(() => result.current.handleDeleteTask("some-id"));

      expect(setSelectedTaskId).toHaveBeenCalledWith(null);
      expect(today.deleteTask).not.toHaveBeenCalled();
      expect(week.deleteTask).not.toHaveBeenCalled();
      expect(later.deleteTask).not.toHaveBeenCalled();
    });

    // FR2: falls back to today.deleteTask for unknown box
    it("should fallback to today.deleteTask when box is not in deleteByBox", () => {
      const task = buildTask({ box: BOX.INBOX });
      const { result } = renderHandlers({ selectedTask: task });

      act(() => result.current.handleDeleteTask(task.id));

      expect(today.deleteTask).toHaveBeenCalledWith(task.id);
    });
  });
});
