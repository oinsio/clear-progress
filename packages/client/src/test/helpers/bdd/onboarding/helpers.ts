// implements FR1, FR2, FR4, FR7 of onboarding-goal
import { STORAGE_KEYS } from "@/constants";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { OnboardingService } from "@/services/OnboardingService";

export const createOnboardingService = (): OnboardingService => {
  const goalRepository = new GoalRepository();
  const taskRepository = new TaskRepository();
  const checklistRepository = new ChecklistRepository();
  return new OnboardingService(
    goalRepository,
    taskRepository,
    checklistRepository,
  );
};

export const clearOnboardingState = async (): Promise<void> => {
  await db.goals.clear();
  await db.tasks.clear();
  await db.checklist_items.clear();
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_SHOWN);
};
