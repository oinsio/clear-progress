import type { Goal } from "@/types/entities";
import type { GoalStatus } from "@/types/common";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { GOAL_STATUS_SORT_ORDER } from "@/constants";
import { hasEntityChanged } from "@/utils/deepEqual";
import { toISOTimestamp } from "@/utils/dateHelpers";

export class GoalService {
  constructor(private readonly goalRepository: GoalRepository) {}

  async getAll(): Promise<Goal[]> {
    const goals = await this.goalRepository.getActive();
    return goals.sort((goalA, goalB) => goalA.sort_order - goalB.sort_order);
  }

  async getById(id: string): Promise<Goal | undefined> {
    return this.goalRepository.getById(id);
  }

  async create(partialGoal: Pick<Goal, "name"> & Partial<Goal>): Promise<Goal> {
    const existingGoals = await this.goalRepository.getActive();
    const now = toISOTimestamp();
    const goal: Goal = {
      description: "",
      cover_file_id: "",
      status: "planning",
      sort_order: existingGoals.length,
      ...partialGoal,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
      revision: 0,
      needsSync: true,
    };
    await this.goalRepository.create(goal);
    return goal;
  }

  async update(id: string, changes: Partial<Goal>): Promise<Goal> {
    const existingGoal = await this.goalRepository.getById(id);
    if (!existingGoal) {
      throw new Error(`Goal not found: ${id}`);
    }

    // Создаем обновленную версию без изменения метаданных
    const candidateGoal: Goal = {
      ...existingGoal,
      ...changes,
      id,
    };

    // Проверяем, действительно ли что-то изменилось
    const hasChanged = hasEntityChanged(existingGoal, candidateGoal);

    // Применяем метаданные только если есть изменения
    const updatedGoal: Goal = {
      ...candidateGoal,
      updated_at: hasChanged
        ? toISOTimestamp()
        : existingGoal.updated_at,
      version: hasChanged ? existingGoal.version + 1 : existingGoal.version,
      needsSync: hasChanged,
    };

    await this.goalRepository.update(updatedGoal);
    return updatedGoal;
  }

  async updateStatus(id: string, status: GoalStatus): Promise<Goal> {
    return this.update(id, { status });
  }

  async softDelete(id: string): Promise<Goal> {
    return this.update(id, { is_deleted: true });
  }

  async restore(id: string): Promise<Goal> {
    return this.update(id, { is_deleted: false });
  }

  async searchByName(query: string): Promise<Goal[]> {
    const allGoals = await this.goalRepository.getActive();
    const lowerQuery = query.toLowerCase();
    const matchingGoals = allGoals.filter(
      (goal) =>
        goal.name.toLowerCase().includes(lowerQuery) ||
        goal.description.toLowerCase().includes(lowerQuery),
    );
    return matchingGoals.sort((goalA, goalB) => {
      const priorityA = GOAL_STATUS_SORT_ORDER[goalA.status];
      const priorityB = GOAL_STATUS_SORT_ORDER[goalB.status];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return goalB.updated_at > goalA.updated_at ? 1 : -1;
    });
  }

  async reorderGoals(orderedGoals: Goal[]): Promise<void> {
    if (orderedGoals.length === 0) return;

    // Проверяем, изменился ли хотя бы один sort_order
    const hasAnyOrderChanged = orderedGoals.some(
      (goal, index) => goal.sort_order !== index,
    );
    if (!hasAnyOrderChanged) {
      return; // Ничего не изменилось, не синхронизируем
    }

    const now = toISOTimestamp();
    const updatedGoals = orderedGoals.map((goal, index) => {
      const orderChanged = goal.sort_order !== index;
      return {
        ...goal,
        sort_order: index,
        updated_at: orderChanged ? now : goal.updated_at,
        version: orderChanged ? goal.version + 1 : goal.version,
        needsSync: orderChanged,
      };
    });
    await this.goalRepository.bulkUpsert(updatedGoals);
  }
}
