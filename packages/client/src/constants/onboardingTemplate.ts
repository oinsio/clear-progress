import type { OnboardingTemplate } from "@/types/onboarding";

/** Implements FR5, FR6 of onboarding-goal */
export const ONBOARDING_TEMPLATE: OnboardingTemplate = {
  goal: {
    nameKey: "onboarding.goalName",
    descriptionKey: "onboarding.goalDescription",
  },
  tasks: [
    {
      nameKey: "onboarding.task1Name",
      descriptionKey: "onboarding.task1Description",
      box: "today",
    },
    {
      nameKey: "onboarding.task2Name",
      descriptionKey: "onboarding.task2Description",
      box: "later",
    },
    {
      nameKey: "onboarding.task3Name",
      descriptionKey: "onboarding.task3Description",
      box: "later",
    },
    {
      nameKey: "onboarding.task4Name",
      descriptionKey: "onboarding.task4Description",
      box: "later",
    },
    {
      nameKey: "onboarding.task5Name",
      descriptionKey: "onboarding.task5Description",
      box: "later",
    },
  ],
};
