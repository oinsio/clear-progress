import { TaskRepository } from "@/db/repositories/TaskRepository";
import type { Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { type Clock, systemClock } from "@/lib/temporal";

export class HiddenTaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  async revealHiddenTasks(): Promise<Task[]> {
    const currentDate = this.clock.plainDateISO().toString();
    const tasksToReveal =
      await this.taskRepository.getTasksToReveal(currentDate);

    if (tasksToReveal.length === 0) {
      return [];
    }

    const now = toISOTimestamp(this.clock);
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
