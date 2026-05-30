import { useCallback, useEffect, useState } from "react";
import { defaultTaskService } from "@/services/defaultServices";
import type { Task } from "@/types/entities";

interface UseTaskSelectionOptions {
  taskArrays: Task[][];
  isFocusMode?: boolean;
}

interface UseTaskSelectionReturn {
  selectedTaskId: string | null;
  expandedTaskId: string | null;
  selectedTask: Task | null;
  setSelectedTaskId: (id: string | null) => void;
  setExpandedTaskId: (id: string | null) => void;
  handleTaskSelect: (id: string) => void;
  handleTaskExpand: (id: string | null) => void;
  handleDetailPanelClose: () => void;
}

/**
 * Manages task selection state: selectedTaskId, expandedTaskId, and resolved selectedTask.
 * Resolves selectedTask from provided task arrays, falling back to defaultTaskService.getById.
 *
 * Implements FR8 of refactor-task-pages.
 */
export function useTaskSelection({
  taskArrays,
  isFocusMode = false,
}: UseTaskSelectionOptions): UseTaskSelectionReturn {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleTaskSelect = useCallback((id: string) => {
    setSelectedTaskId((previous) => (previous === id ? null : id));
  }, []);

  const handleTaskExpand = useCallback((id: string | null) => {
    setExpandedTaskId(id);
  }, []);

  const handleDetailPanelClose = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  useEffect(() => {
    if (!selectedTaskId) {
      setSelectedTask(null);
      return;
    }

    const allTasks = taskArrays.flat();
    const foundTask = allTasks.find((task) => task.id === selectedTaskId);

    if (foundTask) {
      setSelectedTask(foundTask);
      if (isFocusMode && foundTask.is_completed) {
        setSelectedTaskId(null);
      }
    } else {
      void (async () => {
        const taskFromDatabase =
          await defaultTaskService.getById(selectedTaskId);
        if (taskFromDatabase) {
          setSelectedTask(taskFromDatabase);
        }
      })();
    }
  }, [selectedTaskId, taskArrays, isFocusMode]);

  return {
    selectedTaskId,
    expandedTaskId,
    selectedTask,
    setSelectedTaskId,
    setExpandedTaskId,
    handleTaskSelect,
    handleTaskExpand,
    handleDetailPanelClose,
  };
}
