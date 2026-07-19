import { beforeEach } from "vitest";
import { db } from "../database";
import { GoalRepository } from "./GoalRepository";

export function createGoalRepositorySetup(): {
  getRepository: () => GoalRepository;
} {
  let goalRepository: GoalRepository;

  beforeEach(async () => {
    await db.goals.clear();
    goalRepository = new GoalRepository();
  });

  return {
    getRepository: () => goalRepository,
  };
}
