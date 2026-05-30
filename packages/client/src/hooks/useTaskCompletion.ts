import { useCallback } from "react";

type CompleteFn = (id: string) => Promise<string | null | undefined>;

interface UseTaskCompletionOptions {
  completeFn: CompleteFn;
  selectedTaskId: string | null;
  expandedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  setExpandedTaskId: (id: string | null) => void;
  afterComplete?: () => Promise<void> | void;
}

/**
 * Parameterized completion handler for tasks.
 * Handles recurring tasks, selection clearing, and expansion clearing.
 *
 * Implements FR9 of refactor-task-pages.
 */
export function useTaskCompletion({
  completeFn,
  selectedTaskId,
  expandedTaskId,
  setSelectedTaskId,
  setExpandedTaskId,
  afterComplete,
}: UseTaskCompletionOptions): (id: string) => Promise<void> {
  return useCallback(
    async (taskId: string) => {
      const recurringTaskId = await completeFn(taskId);

      if (recurringTaskId) {
        setSelectedTaskId(recurringTaskId);
      } else if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }

      if (expandedTaskId === taskId) {
        setExpandedTaskId(null);
      }

      if (afterComplete) {
        await afterComplete();
      }
    },
    [
      completeFn,
      selectedTaskId,
      expandedTaskId,
      setSelectedTaskId,
      setExpandedTaskId,
      afterComplete,
    ],
  );
}
