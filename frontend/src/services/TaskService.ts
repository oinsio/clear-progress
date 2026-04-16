import type { Task, ChecklistItem } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { hasEntityChanged } from "@/utils/deepEqual";
import {
  parseRepeatRule,
  calculateNextDate,
  calculateAppearDate,
} from "@/utils/repeatRule";
import { toISOTimestamp, toISODate } from "@/utils/dateHelpers";
import { Temporal } from "@/lib/temporal";

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly checklistRepository: ChecklistRepository,
  ) {}

  private sortBySortOrder(tasks: Task[]): Task[] {
    return tasks.sort((taskA, taskB) => taskA.sort_order - taskB.sort_order);
  }

  async getByBox(box: Box): Promise<Task[]> {
    const tasks = await this.taskRepository.getByBox(box);
    return this.sortBySortOrder(tasks);
  }

  async getById(id: string): Promise<Task | undefined> {
    return this.taskRepository.getById(id);
  }

  async create(
    partialTask: Pick<Task, "name" | "box"> & Partial<Task>,
  ): Promise<Task> {
    const existingTasks = await this.taskRepository.getByBox(partialTask.box);
    const now = toISOTimestamp();
    const task: Task = {
      description: "",
      goal_id: "",
      context_id: "",
      category_id: "",
      is_completed: false,
      completed_at: "",
      repeat_rule: "",
      is_hidden: false,
      next_date: "",
      appear_date: "",
      original_task_id: "",
      sort_order: existingTasks.length,
      ...partialTask,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
      revision: 0,
      needsSync: true,
    };
    await this.taskRepository.create(task);
    return task;
  }

  async update(id: string, changes: Partial<Task>): Promise<Task> {
    const existingTask = await this.taskRepository.getById(id);
    if (!existingTask) {
      throw new Error(`Task not found: ${id}`);
    }

    // Создаем обновленную версию без изменения метаданных
    const candidateTask: Task = {
      ...existingTask,
      ...changes,
      id,
    };

    // Проверяем, действительно ли что-то изменилось
    const hasChanged = hasEntityChanged(existingTask, candidateTask);

    // Применяем метаданные только если есть изменения
    const updatedTask: Task = {
      ...candidateTask,
      updated_at: hasChanged ? toISOTimestamp() : existingTask.updated_at,
      version: hasChanged ? existingTask.version + 1 : existingTask.version,
      needsSync: hasChanged,
    };

    await this.taskRepository.update(updatedTask);
    return updatedTask;
  }

  async complete(
    id: string,
  ): Promise<{ completed: Task; recurring: Task | null }> {
    const existingTask = await this.taskRepository.getById(id);
    if (!existingTask) {
      throw new Error(`Task not found: ${id}`);
    }

    const now = toISOTimestamp();
    const completedTask = await this.update(id, {
      is_completed: true,
      completed_at: now,
    });

    let recurringTask: Task | null = null;

    if (existingTask.repeat_rule) {
      try {
        const rule = parseRepeatRule(existingTask.repeat_rule);
        if (rule) {
          // Вычислить next_date и appear_date
          const nextDate = calculateNextDate(
            rule,
            now,
            existingTask.next_date || undefined,
          );
          const appearDate = calculateAppearDate(nextDate, rule.advance_days);

          // Определяем original_task_id для поиска
          const searchId = existingTask.original_task_id || existingTask.id;

          // Проверить, существует ли уже такая скрытая задача
          const existingHiddenTask =
            await this.taskRepository.findHiddenRecurringTask(searchId);

          if (existingHiddenTask) {
            // Обновляем существующую копию со всеми актуальными полями
            recurringTask = await this.update(existingHiddenTask.id, {
              name: existingTask.name,
              description: existingTask.description,
              goal_id: existingTask.goal_id,
              context_id: existingTask.context_id,
              category_id: existingTask.category_id,
              repeat_rule: existingTask.repeat_rule,
              next_date: toISODate(nextDate),
              appear_date: toISODate(appearDate),
              box: rule.target_box,
            });
          } else {
            // Создать скрытый клон только если его ещё нет
            recurringTask = await this.createRecurringCopy(existingTask, {
              is_hidden: true,
              next_date: toISODate(nextDate),
              appear_date: toISODate(appearDate),
              box: rule.target_box,
            });
          }
        }
      } catch (error) {
        console.error("Failed to create recurring task:", error);
        // Не прерываем завершение задачи, если не удалось создать клон
      }
    }

    return { completed: completedTask, recurring: recurringTask };
  }

  private async createRecurringCopy(
    task: Task,
    overrides: Partial<Task>,
  ): Promise<Task> {
    const {
      id: _id,
      version: _version,
      created_at: _created_at,
      updated_at: _updated_at,
      is_completed: _is_completed,
      completed_at: _completed_at,
      ...taskProps
    } = task;
    void _id;
    void _version;
    void _created_at;
    void _updated_at;
    void _is_completed;
    void _completed_at;

    const newTask = await this.create({
      ...taskProps,
      ...overrides,
      is_completed: false,
      completed_at: "",
      original_task_id: task.original_task_id || task.id,
    });

    await this.copyChecklistItems(task.id, newTask.id);
    return newTask;
  }

  private async copyChecklistItems(
    sourceTaskId: string,
    targetTaskId: string,
  ): Promise<void> {
    const checklistItems =
      await this.checklistRepository.getByTaskId(sourceTaskId);
    if (checklistItems.length === 0) return;
    const now = toISOTimestamp();
    for (const item of checklistItems) {
      const copiedItem: ChecklistItem = {
        ...item,
        id: crypto.randomUUID(),
        task_id: targetTaskId,
        is_completed: false,
        created_at: now,
        updated_at: now,
        version: 1,
        revision: 0,
        needsSync: true,
      };
      await this.checklistRepository.create(copiedItem);
    }
  }

  async noncomplete(id: string): Promise<Task> {
    const existingTask = await this.taskRepository.getById(id);
    if (!existingTask) {
      throw new Error(`Task not found: ${id}`);
    }
    return this.update(id, {
      is_completed: false,
      completed_at: "",
    });
  }

  async softDelete(id: string): Promise<Task> {
    // Найти все копии этой задачи
    const copies = await this.taskRepository.findByOriginalTaskId(id);

    if (copies.length > 0) {
      // Найти первую активную копию (не удалённую)
      const newOriginal = copies.find((copy) => !copy.is_deleted);

      if (newOriginal) {
        // Переназначить все остальные копии на новый оригинал
        for (const copy of copies) {
          if (copy.id !== newOriginal.id) {
            await this.update(copy.id, { original_task_id: newOriginal.id });
          }
        }

        // Очистить original_task_id у нового оригинала
        await this.update(newOriginal.id, { original_task_id: "" });
      }
    }

    // Удалить исходную задачу
    return this.update(id, { is_deleted: true });
  }

  async restore(id: string): Promise<Task> {
    return this.update(id, { is_deleted: false });
  }

  async moveToBox(id: string, box: Box): Promise<Task> {
    return this.update(id, { box });
  }

  async getCompleted(): Promise<Task[]> {
    const tasks = await this.taskRepository.getCompleted();
    return tasks.sort((taskA, taskB) => {
      if (taskA.completed_at && taskB.completed_at) {
        return Temporal.Instant.compare(
          Temporal.Instant.from(taskB.completed_at),
          Temporal.Instant.from(taskA.completed_at),
        );
      }
      return taskB.sort_order - taskA.sort_order;
    });
  }

  async reorderTasks(orderedTasks: Task[]): Promise<void> {
    if (orderedTasks.length === 0) return;

    // Проверяем, изменился ли хотя бы один sort_order
    const hasAnyOrderChanged = orderedTasks.some(
      (task, index) => task.sort_order !== index,
    );
    if (!hasAnyOrderChanged) {
      return; // Ничего не изменилось, не синхронизируем
    }

    const now = toISOTimestamp();
    const updatedTasks = orderedTasks.map((task, index) => {
      const orderChanged = task.sort_order !== index;
      return {
        ...task,
        sort_order: index,
        updated_at: orderChanged ? now : task.updated_at,
        version: orderChanged ? task.version + 1 : task.version,
        needsSync: orderChanged,
      };
    });
    await this.taskRepository.bulkUpsert(updatedTasks);
  }

  async getByGoalId(goalId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getByGoalId(goalId);
    return this.sortBySortOrder(tasks);
  }

  private countTasksByField(
    tasks: Task[],
    fieldGetter: (task: Task) => string,
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      const fieldValue = fieldGetter(task);
      if (fieldValue) {
        counts[fieldValue] = (counts[fieldValue] ?? 0) + 1;
      }
    }
    return counts;
  }

  async getGoalTaskCounts(): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.getActiveIncomplete();
    return this.countTasksByField(tasks, (task) => task.goal_id);
  }

  async getCategoryTaskCounts(): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.getActiveIncomplete();
    return this.countTasksByField(tasks, (task) => task.category_id);
  }

  async getByCategoryId(categoryId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getByCategoryId(categoryId);
    return this.sortBySortOrder(tasks);
  }

  async getContextTaskCounts(): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.getActiveIncomplete();
    return this.countTasksByField(tasks, (task) => task.context_id);
  }

  async getByContextId(contextId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getByContextId(contextId);
    return this.sortBySortOrder(tasks);
  }

  async searchByName(query: string): Promise<Task[]> {
    const allTasks = await this.taskRepository.getActive();
    const lowerQuery = query.toLowerCase();
    const matchingTasks = allTasks.filter(
      (task) =>
        task.name.toLowerCase().includes(lowerQuery) ||
        task.description.toLowerCase().includes(lowerQuery),
    );
    return matchingTasks.sort((taskA, taskB) => {
      if (taskA.is_completed !== taskB.is_completed) {
        return taskA.is_completed ? 1 : -1;
      }
      return taskB.updated_at > taskA.updated_at ? 1 : -1;
    });
  }

  async duplicate(id: string): Promise<Task> {
    const originalTask = await this.taskRepository.getById(id);
    if (!originalTask) {
      throw new Error(`Task not found: ${id}`);
    }

    const newTask = await this.create({
      name: originalTask.name,
      box: originalTask.box,
      description: originalTask.description,
      goal_id: originalTask.goal_id,
      context_id: originalTask.context_id,
      category_id: originalTask.category_id,
      repeat_rule: originalTask.repeat_rule,
    });

    await this.copyChecklistItems(originalTask.id, newTask.id);

    return newTask;
  }
}
