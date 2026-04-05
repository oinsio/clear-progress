import { useMemo } from "react";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useFilteredTasks, type UseFilteredTasksReturn } from "./useFilteredTasks";

const defaultTaskService = new TaskService(new TaskRepository(), new ChecklistRepository());

export interface UseContextTasksReturn extends UseFilteredTasksReturn {}

export function useContextTasks(
  contextId: string,
  taskService: TaskService = defaultTaskService,
): UseContextTasksReturn {
  const config = useMemo(
    () => ({
      queryFn: () => taskService.getByContextId(contextId),
      createTaskData: { context_id: contextId },
    }),
    [contextId, taskService],
  );

  return useFilteredTasks(config, taskService);
}
