import type { Box } from "@/types/common";

/** Implements FR5, FR6 of onboarding-goal */
export interface OnboardingTaskTemplate {
  nameKey: string;
  descriptionKey: string;
  box: Box;
}

/** Implements FR5, FR6 of onboarding-goal */
export interface OnboardingTemplate {
  goal: {
    nameKey: string;
    descriptionKey: string;
  };
  tasks: OnboardingTaskTemplate[];
}
