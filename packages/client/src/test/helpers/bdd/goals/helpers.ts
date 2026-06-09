import { expect } from "vitest";
import { db } from "@/db/database";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { GoalService } from "@/services/GoalService";
import { compareCompletedTasks } from "@/services/SortOrderService";
import { buildGoal } from "@/test/factories/goalFactory";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Goal, Task } from "@/types/entities";

export function createScenarioContext() {
  const goalIds = new Map<string, string>();
  let goalService: GoalService;

  const reset = async () => {
    await db.goals.clear();
    await db.tasks.clear();
    goalIds.clear();
    goalService = new GoalService(new GoalRepository());
  };

  return {
    goalIds,
    get goalService() {
      return goalService;
    },
    reset,
  };
}

export async function seedGoal(
  goalIds: Map<string, string>,
  name: string,
  overrides: Partial<Goal> = {},
) {
  const goalId = crypto.randomUUID();
  goalIds.set(name, goalId);
  await db.goals.add(buildGoal({ id: goalId, ...overrides }));
  return goalId;
}

export async function getGoal(
  goalIds: Map<string, string>,
  name: string,
): Promise<Goal> {
  return (await db.goals.get(getIdOrThrow(goalIds, name))) as Goal;
}

export async function seedGoalsWithOrder(
  goalIds: Map<string, string>,
  names: string[],
) {
  const { rebalanceKeys } = await import("@/services/SortOrderService");
  const keys = rebalanceKeys(names.length);
  for (let i = 0; i < names.length; i++) {
    await seedGoal(goalIds, names[i], {
      sort_order: keys[i],
      needsSync: false,
    });
  }
}

export function sortCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.is_completed).sort(compareCompletedTasks);
}

export async function moveGoalBefore(
  goalIds: Map<string, string>,
  goalService: GoalService,
  movedName: string,
  beforeName: string,
) {
  const { generateKeyBetween } = await import("@/services/SortOrderService");
  const targetGoal = await getGoal(goalIds, beforeName);
  const movedGoal = await getGoal(goalIds, movedName);
  const newKey = generateKeyBetween(null, String(targetGoal.sort_order));
  await goalService.reorderGoals(movedGoal.id, newKey);
}

export async function expectGoalNeedsSync(
  goalIds: Map<string, string>,
  name: string,
  expectedNeedsSync: boolean,
) {
  const goal = await getGoal(goalIds, name);
  expect(goal.needsSync).toBe(expectedNeedsSync);
}

export function expectTaskOrder(
  tasks: Task[],
  expectedFirst: string,
  expectedSecond: string,
) {
  expect(tasks[0].name).toBe(expectedFirst);
  expect(tasks[1].name).toBe(expectedSecond);
}
