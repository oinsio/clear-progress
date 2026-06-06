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

export type UseCategoryTasksReturn = UseFilteredTasksReturn;

export function useCategoryTasks(
  categoryId: string,
  taskService: TaskService = defaultTaskService,
): UseCategoryTasksReturn {
  const config = useMemo(
    () => ({
      queryFn: () => taskService.getByCategoryId(categoryId),
      createTaskData: { category_id: categoryId },
    }),
    [categoryId, taskService],
  );

  return useFilteredTasks(config, taskService);
}
