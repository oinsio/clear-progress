import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import type { UseTasksReturn } from "@/hooks/useTasks";
import { buildTasksHook } from "@/test/builders/hookBuilders";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { useCompletedTaskHandlers } from "./useCompletedTaskHandlers";

describe("useCompletedTaskHandlers", () => {
  let inbox: UseTasksReturn;
  let today: UseTasksReturn;
  let week: UseTasksReturn;
  let later: UseTasksReturn;
  let setSelectedTaskId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    inbox = buildTasksHook();
    today = buildTasksHook();
    week = buildTasksHook();
    later = buildTasksHook();
    setSelectedTaskId = vi.fn();
  });

  function renderHandlers(
    overrides: { completedTasks?: Task[]; selectedTask?: Task | null } = {},
  ) {
    return renderHook(() =>
      useCompletedTaskHandlers({
        completedTasks: overrides.completedTasks ?? [],
        inbox,
        today,
        week,
        later,
        selectedTask: overrides.selectedTask ?? null,
        setSelectedTaskId,
      }),
    );
  }

  // FR3: returns all four handler functions
  it("should return handleUpdateTask, handleMoveTask, handleDeleteTask, handleDuplicateTask", () => {
    const { result } = renderHandlers();
    expect(result.current.handleUpdateTask).toBeInstanceOf(Function);
    expect(result.current.handleMoveTask).toBeInstanceOf(Function);
    expect(result.current.handleDeleteTask).toBeInstanceOf(Function);
    expect(result.current.handleDuplicateTask).toBeInstanceOf(Function);
  });

  describe("handleUpdateTask", () => {
    // FR3: updates via inbox.updateTask for inbox-box task (otherTask in different box)
    it("should call inbox.updateTask when completed task was in inbox", async () => {
      const otherTask = buildTask({ box: BOX.WEEK, is_completed: true });
      const task = buildTask({ box: BOX.INBOX, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [otherTask, task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { name: "Updated" }),
      );

      expect(inbox.updateTask).toHaveBeenCalledWith(task.id, {
        name: "Updated",
      });
    });

    // FR3: updates via today.updateTask for today-box task
    it("should call today.updateTask when completed task was in today", async () => {
      const task = buildTask({ box: BOX.TODAY, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { name: "Updated" }),
      );

      expect(today.updateTask).toHaveBeenCalledWith(task.id, {
        name: "Updated",
      });
    });

    // FR3: updates via week.updateTask for week-box task
    it("should call week.updateTask when completed task was in week", async () => {
      const task = buildTask({ box: BOX.WEEK, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { name: "Updated" }),
      );

      expect(week.updateTask).toHaveBeenCalledWith(task.id, {
        name: "Updated",
      });
    });

    // FR3: updates via later.updateTask for later-box task
    it("should call later.updateTask when completed task was in later", async () => {
      const task = buildTask({ box: BOX.LATER, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { name: "Updated" }),
      );

      expect(later.updateTask).toHaveBeenCalledWith(task.id, {
        name: "Updated",
      });
    });

    // FR3: does nothing when task is not found
    it("should not call any updateTask when task id is not found", async () => {
      const { result } = renderHandlers();

      await act(() =>
        result.current.handleUpdateTask("nonexistent", { name: "X" }),
      );

      expect(inbox.updateTask).not.toHaveBeenCalled();
      expect(today.updateTask).not.toHaveBeenCalled();
      expect(week.updateTask).not.toHaveBeenCalled();
      expect(later.updateTask).not.toHaveBeenCalled();
    });

    // FR3: falls back to today.updateTask for unknown box
    it("should fallback to today.updateTask when box is unknown", async () => {
      const task = buildTask({ box: "unknown" as never, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [task] });

      await act(() =>
        result.current.handleUpdateTask(task.id, { name: "Updated" }),
      );

      expect(today.updateTask).toHaveBeenCalledWith(task.id, {
        name: "Updated",
      });
    });
  });

  describe("handleMoveTask", () => {
    // FR3: moves via inbox.moveTask for inbox-box task (otherTask in different box)
    it("should call inbox.moveTask when completed task was in inbox", async () => {
      const otherTask = buildTask({ box: BOX.LATER, is_completed: true });
      const task = buildTask({ box: BOX.INBOX, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [otherTask, task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.TODAY));

      expect(inbox.moveTask).toHaveBeenCalledWith(task.id, BOX.TODAY);
    });

    // FR3: moves via today.moveTask for today-box task
    it("should call today.moveTask when completed task was in today", async () => {
      const task = buildTask({ box: BOX.TODAY, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.WEEK));

      expect(today.moveTask).toHaveBeenCalledWith(task.id, BOX.WEEK);
    });

    // FR3: moves via week.moveTask for week-box task
    it("should call week.moveTask when completed task was in week", async () => {
      const task = buildTask({ box: BOX.WEEK, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.LATER));

      expect(week.moveTask).toHaveBeenCalledWith(task.id, BOX.LATER);
    });

    // FR3: moves via later.moveTask for later-box task
    it("should call later.moveTask when completed task was in later", async () => {
      const task = buildTask({ box: BOX.LATER, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.TODAY));

      expect(later.moveTask).toHaveBeenCalledWith(task.id, BOX.TODAY);
    });

    // FR3: does nothing when task is not found
    it("should not call any moveTask when task id is not found", async () => {
      const { result } = renderHandlers();

      await act(() => result.current.handleMoveTask("nonexistent", BOX.WEEK));

      expect(inbox.moveTask).not.toHaveBeenCalled();
      expect(today.moveTask).not.toHaveBeenCalled();
      expect(week.moveTask).not.toHaveBeenCalled();
      expect(later.moveTask).not.toHaveBeenCalled();
    });

    // FR3: falls back to today.moveTask for unknown box
    it("should fallback to today.moveTask when box is unknown", async () => {
      const task = buildTask({ box: "unknown" as never, is_completed: true });
      const { result } = renderHandlers({ completedTasks: [task] });

      await act(() => result.current.handleMoveTask(task.id, BOX.WEEK));

      expect(today.moveTask).toHaveBeenCalledWith(task.id, BOX.WEEK);
    });
  });

  describe("handleDeleteTask", () => {
    // FR3: clears selection and deletes via selectedTask's box
    it("should set selectedTaskId to null and call today.deleteTask for today task", () => {
      const task = buildTask({ box: BOX.TODAY, is_completed: true });
      const { result } = renderHandlers({
        completedTasks: [task],
        selectedTask: task,
      });

      act(() => result.current.handleDeleteTask(task.id));

      expect(setSelectedTaskId).toHaveBeenCalledWith(null);
      expect(today.deleteTask).toHaveBeenCalledWith(task.id);
    });

    // FR3: deletes via week.deleteTask for week task
    it("should call week.deleteTask when selected task is in week box", () => {
      const task = buildTask({ box: BOX.WEEK, is_completed: true });
      const { result } = renderHandlers({
        completedTasks: [task],
        selectedTask: task,
      });

      act(() => result.current.handleDeleteTask(task.id));

      expect(week.deleteTask).toHaveBeenCalledWith(task.id);
    });

    // FR3: deletes via later.deleteTask for later task
    it("should call later.deleteTask when selected task is in later box", () => {
      const task = buildTask({ box: BOX.LATER, is_completed: true });
      const { result } = renderHandlers({
        completedTasks: [task],
        selectedTask: task,
      });

      act(() => result.current.handleDeleteTask(task.id));

      expect(later.deleteTask).toHaveBeenCalledWith(task.id);
    });

    // FR3: deletes via inbox.deleteTask for inbox task
    it("should call inbox.deleteTask when selected task is in inbox box", () => {
      const task = buildTask({ box: BOX.INBOX, is_completed: true });
      const { result } = renderHandlers({
        completedTasks: [task],
        selectedTask: task,
      });

      act(() => result.current.handleDeleteTask(task.id));

      expect(inbox.deleteTask).toHaveBeenCalledWith(task.id);
    });

    // FR3: falls back to finding task from completedTasks when no selectedTask (different boxes to kill find(() => true))
    it("should find task in completedTasks when selectedTask is null", () => {
      const otherTask = buildTask({ box: BOX.WEEK, is_completed: true });
      const task = buildTask({ box: BOX.TODAY, is_completed: true });
      const { result } = renderHandlers({
        completedTasks: [otherTask, task],
        selectedTask: null,
      });

      act(() => result.current.handleDeleteTask(task.id));

      expect(today.deleteTask).toHaveBeenCalledWith(task.id);
      expect(week.deleteTask).not.toHaveBeenCalled();
    });

    // FR3: does nothing when both selectedTask is null and task not found
    it("should not call any deleteTask when task cannot be found", () => {
      const { result } = renderHandlers({ selectedTask: null });

      act(() => result.current.handleDeleteTask("nonexistent"));

      expect(setSelectedTaskId).toHaveBeenCalledWith(null);
      expect(inbox.deleteTask).not.toHaveBeenCalled();
      expect(today.deleteTask).not.toHaveBeenCalled();
      expect(week.deleteTask).not.toHaveBeenCalled();
      expect(later.deleteTask).not.toHaveBeenCalled();
    });

    // FR3: prefers selectedTask over completedTasks lookup
    it("should use selectedTask when both selectedTask and completedTasks have the task", () => {
      const selectedTask = buildTask({ box: BOX.WEEK, is_completed: true });
      const completedTask = buildTask({
        id: selectedTask.id,
        box: BOX.TODAY,
        is_completed: true,
      });
      const { result } = renderHandlers({
        completedTasks: [completedTask],
        selectedTask: selectedTask,
      });

      act(() => result.current.handleDeleteTask(selectedTask.id));

      expect(week.deleteTask).toHaveBeenCalledWith(selectedTask.id);
      expect(today.deleteTask).not.toHaveBeenCalled();
    });
  });

  describe("handleDuplicateTask", () => {
    // FR3: duplicates via today.duplicateTask for today-box task (otherTask in different box)
    it("should call today.duplicateTask when task is in today box", async () => {
      const otherTask = buildTask({ box: BOX.LATER, is_completed: true });
      const task = buildTask({ box: BOX.TODAY, is_completed: true });
      const newTask = buildTask({ box: BOX.TODAY });
      today = buildTasksHook({
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      const { result } = renderHook(() =>
        useCompletedTaskHandlers({
          completedTasks: [otherTask, task],
          inbox,
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

    // FR3: duplicates via inbox.duplicateTask for inbox-box task
    it("should call inbox.duplicateTask when task is in inbox box", async () => {
      const task = buildTask({ box: BOX.INBOX, is_completed: true });
      const newTask = buildTask({ box: BOX.INBOX });
      inbox = buildTasksHook({
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      const { result } = renderHook(() =>
        useCompletedTaskHandlers({
          completedTasks: [task],
          inbox,
          today,
          week,
          later,
          selectedTask: null,
          setSelectedTaskId,
        }),
      );

      await act(() => result.current.handleDuplicateTask(task.id));

      expect(inbox.duplicateTask).toHaveBeenCalledWith(task.id);
      expect(setSelectedTaskId).toHaveBeenCalledWith(newTask.id);
    });

    // FR3: duplicates via week.duplicateTask for week-box task
    it("should call week.duplicateTask when task is in week box", async () => {
      const task = buildTask({ box: BOX.WEEK, is_completed: true });
      const newTask = buildTask({ box: BOX.WEEK });
      week = buildTasksHook({
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      const { result } = renderHook(() =>
        useCompletedTaskHandlers({
          completedTasks: [task],
          inbox,
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

    // FR3: duplicates via later.duplicateTask for later-box task
    it("should call later.duplicateTask when task is in later box", async () => {
      const task = buildTask({ box: BOX.LATER, is_completed: true });
      const newTask = buildTask({ box: BOX.LATER });
      later = buildTasksHook({
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      const { result } = renderHook(() =>
        useCompletedTaskHandlers({
          completedTasks: [task],
          inbox,
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

    // FR3: does nothing when task is not found
    it("should not call duplicateTask when task id is not found", async () => {
      const { result } = renderHandlers();

      await act(() => result.current.handleDuplicateTask("nonexistent"));

      expect(inbox.duplicateTask).not.toHaveBeenCalled();
      expect(today.duplicateTask).not.toHaveBeenCalled();
      expect(week.duplicateTask).not.toHaveBeenCalled();
      expect(later.duplicateTask).not.toHaveBeenCalled();
    });

    // FR3: falls back to today.duplicateTask for unknown box
    it("should fallback to today.duplicateTask when box is unknown", async () => {
      const task = buildTask({ box: "unknown" as never, is_completed: true });
      const newTask = buildTask();
      today = buildTasksHook({
        duplicateTask: vi.fn().mockResolvedValue(newTask),
      });
      const { result } = renderHook(() =>
        useCompletedTaskHandlers({
          completedTasks: [task],
          inbox,
          today,
          week,
          later,
          selectedTask: null,
          setSelectedTaskId,
        }),
      );

      await act(() => result.current.handleDuplicateTask(task.id));

      expect(today.duplicateTask).toHaveBeenCalledWith(task.id);
    });
  });
});
