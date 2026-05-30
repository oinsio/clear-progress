/**
 * Task dispatch handlers for ActiveTasksPage.
 * Routes operations (move, update, duplicate, delete) to the correct box.
 *
 * Implements FR2 of refactor-task-pages.
 */
import { useCallback } from "react";
import { BOX } from "@/constants";
import type { UseTasksReturn } from "@/hooks/useTasks";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";

interface UseActiveTaskHandlersOptions {
  today: UseTasksReturn;
  week: UseTasksReturn;
  later: UseTasksReturn;
  selectedTask: Task | null;
  setSelectedTaskId: (id: string | null) => void;
}

export function useActiveTaskHandlers({
  today,
  week,
  later,
  selectedTask,
  setSelectedTaskId,
}: UseActiveTaskHandlersOptions) {
  const reloadAllBoxes = useCallback(async () => {
    await Promise.all([today.reload(), week.reload(), later.reload()]);
  }, [today, week, later]);

  const handleMoveTask = useCallback(
    async (id: string, targetBox: Box) => {
      const allTasks = [...today.tasks, ...week.tasks, ...later.tasks];
      const task = allTasks.find((taskItem) => taskItem.id === id);
      if (!task) return;
      const moveByBox: Record<
        Box,
        (taskId: string, box: Box) => Promise<void>
      > = {
        [BOX.INBOX]: today.moveTask,
        [BOX.TODAY]: today.moveTask,
        [BOX.WEEK]: week.moveTask,
        [BOX.LATER]: later.moveTask,
      };
      await moveByBox[task.box](id, targetBox);
      await reloadAllBoxes();
    },
    [today, week, later, reloadAllBoxes],
  );

  const handleUpdateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      const allTasks = [...today.tasks, ...week.tasks, ...later.tasks];
      const task = allTasks.find((taskItem) => taskItem.id === id);
      if (!task) return;
      const updateByBox: Record<
        Box,
        (taskId: string, taskChanges: Partial<Task>) => Promise<void>
      > = {
        [BOX.INBOX]: today.updateTask,
        [BOX.TODAY]: today.updateTask,
        [BOX.WEEK]: week.updateTask,
        [BOX.LATER]: later.updateTask,
      };
      if (changes.box && changes.box !== task.box) {
        await handleMoveTask(id, changes.box as Box);
      } else {
        await updateByBox[task.box](id, changes);
      }
    },
    [today, week, later, handleMoveTask],
  );

  const handleDuplicateTask = useCallback(
    async (id: string) => {
      const allTasks = [...today.tasks, ...week.tasks, ...later.tasks];
      const task = allTasks.find((taskItem) => taskItem.id === id);
      if (!task) return;
      const duplicateByBox: Record<Box, (taskId: string) => Promise<Task>> = {
        [BOX.INBOX]: today.duplicateTask,
        [BOX.TODAY]: today.duplicateTask,
        [BOX.WEEK]: week.duplicateTask,
        [BOX.LATER]: later.duplicateTask,
      };
      const newTask = await duplicateByBox[task.box](id);
      setSelectedTaskId(newTask.id);
    },
    [today, week, later, setSelectedTaskId],
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      setSelectedTaskId(null);
      if (!selectedTask) return;
      const deleteByBox: Record<string, (taskId: string) => Promise<void>> = {
        [BOX.TODAY]: today.deleteTask,
        [BOX.WEEK]: week.deleteTask,
        [BOX.LATER]: later.deleteTask,
      };
      const deleteFn = deleteByBox[selectedTask.box] ?? today.deleteTask;
      void deleteFn(id);
    },
    [selectedTask, today, week, later, setSelectedTaskId],
  );

  return {
    handleMoveTask,
    handleUpdateTask,
    handleDuplicateTask,
    handleDeleteTask,
  };
}
