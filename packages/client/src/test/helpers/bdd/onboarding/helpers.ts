// implements FR1, FR2, FR4, FR7 of onboarding-goal
import { expect } from "vitest";
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

/**
 * Runs detection expecting onboarding to be skipped,
 * and asserts the localStorage flag was set silently.
 * Implements FR1, FR7 of onboarding-goal
 */
export const runDetectionExpectingSkip = async (
  onboardingService: OnboardingService,
): Promise<boolean> => {
  const shouldShow = await onboardingService.shouldShowOnboarding();
  expect(shouldShow).toBe(false);
  expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBe("true");
  return shouldShow;
};

/** Asserts onboarding should not be shown. Implements FR1 of onboarding-goal */
export const assertOnboardingNotShown = (shouldShow: boolean): void => {
  expect(shouldShow).toBe(false);
};

/** Asserts localStorage flag is set to "true". Implements FR7 of onboarding-goal */
export const assertOnboardingFlagSet = (): void => {
  expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBe("true");
};
