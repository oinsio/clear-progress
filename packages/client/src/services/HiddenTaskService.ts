import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { type Clock, systemClock } from "@/lib/temporal";
import type { ISODate, Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

export class HiddenTaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  /** Implements FR4 of day-boundary */
  async revealHiddenTasks(logicalDate?: ISODate): Promise<Task[]> {
    const currentDate = logicalDate ?? this.clock.plainDateISO().toString();
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
        syncStatus: "pending" as const,
      };

      await this.taskRepository.update(updatedTask);
      revealedTasks.push(updatedTask);
    }

    return revealedTasks;
  }
}
