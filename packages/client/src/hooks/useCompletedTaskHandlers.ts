/**
 * Task dispatch handlers for CompletedPage.
 * Routes operations (update, move, duplicate, delete) to the correct box
 * based on the completed task's original box.
 *
 * Implements FR3 of refactor-task-pages.
 */
import { useCallback } from "react";
import { BOX } from "@/constants";
import type { UseTasksReturn } from "@/hooks/useTasks";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";

interface UseCompletedTaskHandlersOptions {
  completedTasks: Task[];
  inbox: UseTasksReturn;
  today: UseTasksReturn;
  week: UseTasksReturn;
  later: UseTasksReturn;
  selectedTask: Task | null;
  setSelectedTaskId: (id: string | null) => void;
}

export function useCompletedTaskHandlers({
  completedTasks,
  inbox,
  today,
  week,
  later,
  selectedTask,
  setSelectedTaskId,
}: UseCompletedTaskHandlersOptions) {
  const handleUpdateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      const task = completedTasks.find((taskItem) => taskItem.id === id);
      if (!task) return;
      const updateByBox: Record<
        Box,
        (taskId: string, taskChanges: Partial<Task>) => Promise<void>
      > = {
        [BOX.INBOX]: inbox.updateTask,
        [BOX.TODAY]: today.updateTask,
        [BOX.WEEK]: week.updateTask,
        [BOX.LATER]: later.updateTask,
      };
      const updateFn = updateByBox[task.box as Box] ?? today.updateTask;
      await updateFn(id, changes);
    },
    [completedTasks, inbox, today, week, later],
  );

  const handleMoveTask = useCallback(
    async (id: string, targetBox: Box) => {
      const task = completedTasks.find((taskItem) => taskItem.id === id);
      if (!task) return;
      const moveByBox: Record<
        Box,
        (taskId: string, box: Box) => Promise<void>
      > = {
        [BOX.INBOX]: inbox.moveTask,
        [BOX.TODAY]: today.moveTask,
        [BOX.WEEK]: week.moveTask,
        [BOX.LATER]: later.moveTask,
      };
      const moveFn = moveByBox[task.box as Box] ?? today.moveTask;
      await moveFn(id, targetBox);
    },
    [completedTasks, inbox, today, week, later],
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      setSelectedTaskId(null);
      const task =
        selectedTask ?? completedTasks.find((taskItem) => taskItem.id === id);
      if (!task) return;
      const deleteByBox: Record<string, (taskId: string) => Promise<void>> = {
        [BOX.INBOX]: inbox.deleteTask,
        [BOX.TODAY]: today.deleteTask,
        [BOX.WEEK]: week.deleteTask,
        [BOX.LATER]: later.deleteTask,
      };
      const deleteFn = deleteByBox[task.box] ?? today.deleteTask;
      void deleteFn(id);
    },
    [
      selectedTask,
      completedTasks,
      inbox,
      today,
      week,
      later,
      setSelectedTaskId,
    ],
  );

  const handleDuplicateTask = useCallback(
    async (id: string) => {
      const task = completedTasks.find((taskItem) => taskItem.id === id);
      if (!task) return;
      const duplicateByBox: Record<Box, (taskId: string) => Promise<Task>> = {
        [BOX.INBOX]: inbox.duplicateTask,
        [BOX.TODAY]: today.duplicateTask,
        [BOX.WEEK]: week.duplicateTask,
        [BOX.LATER]: later.duplicateTask,
      };
      const duplicateFn =
        duplicateByBox[task.box as Box] ?? today.duplicateTask;
      const newTask = await duplicateFn(id);
      setSelectedTaskId(newTask.id);
    },
    [completedTasks, inbox, today, week, later, setSelectedTaskId],
  );

  return {
    handleUpdateTask,
    handleMoveTask,
    handleDeleteTask,
    handleDuplicateTask,
  };
}
