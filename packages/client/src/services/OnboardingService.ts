import { STORAGE_KEYS } from "@/constants";
import { ONBOARDING_TEMPLATE } from "@/constants/onboardingTemplate";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalService } from "@/services/GoalService";
import { TaskService } from "@/services/TaskService";

/**
 * Implements FR1, FR2, FR4, FR7 of onboarding-goal.
 * Orchestrates first-launch detection and onboarding entity creation.
 */
export class OnboardingService {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly taskRepository: TaskRepository,
    private readonly checklistRepository: ChecklistRepository,
  ) {}

  async shouldShowOnboarding(): Promise<boolean> {
    const flagValue = localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN);
    if (flagValue !== null) {
      return false;
    }

    const activeGoals = await this.goalRepository.getActive();
    const activeTasks = await this.taskRepository.getActive();

    if (activeGoals.length > 0 || activeTasks.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SHOWN, "true");
      return false;
    }

    return true;
  }

  /** Implements FR2, FR4 of onboarding-goal */
  async createOnboardingEntities(
    translate: (key: string) => string,
  ): Promise<void> {
    const goalService = new GoalService(this.goalRepository);
    const taskService = new TaskService(
      this.taskRepository,
      this.checklistRepository,
    );

    const goal = await goalService.create({
      name: translate(ONBOARDING_TEMPLATE.goal.nameKey),
      description: translate(ONBOARDING_TEMPLATE.goal.descriptionKey),
      status: "in_progress",
    });

    for (let i = 0; i < ONBOARDING_TEMPLATE.tasks.length; i++) {
      const taskTemplate = ONBOARDING_TEMPLATE.tasks[i];
      await taskService.create({
        name: translate(taskTemplate.nameKey),
        description: translate(taskTemplate.descriptionKey),
        box: taskTemplate.box,
        goal_id: goal.id,
        sort_order: i,
      });
    }

    localStorage.setItem(STORAGE_KEYS.ONBOARDING_SHOWN, "true");
  }
}
