import { useMemo } from "react";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { TaskService } from "@/services/TaskService";
import {
  type UseFilteredTasksReturn,
  useFilteredTasks,
} from "./useFilteredTasks";

const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
  undefined,
  new AttachmentRepository(),
);

export type UseContextTasksReturn = UseFilteredTasksReturn;

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
