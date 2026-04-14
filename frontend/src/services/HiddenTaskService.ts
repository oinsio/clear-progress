import { TaskRepository } from "@/db/repositories/TaskRepository";
import type { Task } from "@/types/entities";

export class HiddenTaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async revealHiddenTasks(): Promise<Task[]> {
    const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const tasksToReveal =
      await this.taskRepository.getTasksToReveal(currentDate);

    if (tasksToReveal.length === 0) {
      return [];
    }

    const now = new Date().toISOString();
    const revealedTasks: Task[] = [];

    for (const task of tasksToReveal) {
      const updatedTask: Task = {
        ...task,
        is_hidden: false,
        updated_at: now,
        version: task.version + 1,
        needsSync: true,
      };

      await this.taskRepository.update(updatedTask);
      revealedTasks.push(updatedTask);
    }

    return revealedTasks;
  }
}
