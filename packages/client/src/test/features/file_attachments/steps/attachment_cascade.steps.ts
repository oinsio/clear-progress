// implements FR14, FR15 of add-file-attachments
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import type { Clock } from "@/lib/temporal";
import { GoalService } from "@/services/GoalService";
import { IdeaService } from "@/services/IdeaService";
import { TaskService } from "@/services/TaskService";
import type { Goal, Idea, ISOTimestamp, Task } from "@/types/entities";

const feature = await loadFeature("../attachment_cascade.feature");

const NOW = "2025-01-15T10:00:00.000Z" as ISOTimestamp;

function buildMockTask(id: string): Task {
  return {
    id,
    name: "Test task",
    description: "",
    box: "inbox",
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
    sort_order: "0",
    is_deleted: false,
    created_at: NOW,
    updated_at: NOW,
    revision: 0,
    syncStatus: "synced" as const,
  } as Task;
}

function buildMockGoal(id: string): Goal {
  return {
    id,
    name: "Test goal",
    description: "",
    cover_hash: "",
    status: "planning",
    sort_order: "0",
    is_deleted: false,
    created_at: NOW,
    updated_at: NOW,
    revision: 0,
    syncStatus: "synced" as const,
  } as Goal;
}

function buildMockIdea(id: string): Idea {
  return {
    id,
    name: "Test idea",
    description: "",
    sort_order: "0",
    is_deleted: false,
    created_at: NOW,
    updated_at: NOW,
    revision: 0,
    syncStatus: "synced" as const,
  } as Idea;
}

function createMockAttachmentRepo() {
  return {
    softDeleteByEntityTypeAndId: vi.fn().mockResolvedValue(0),
    restoreByEntityTypeAndId: vi.fn().mockResolvedValue(0),
  };
}

function createMockTaskRepo(task: Task) {
  return {
    getById: vi.fn().mockResolvedValue(task),
    update: vi
      .fn()
      .mockImplementation(async (updatedTask: Task) => updatedTask),
    findByOriginalTaskId: vi.fn().mockResolvedValue([]),
  };
}

function createMockChecklistRepo() {
  return {
    getAllByTaskId: vi.fn().mockResolvedValue([]),
  };
}

function createMockGoalRepo(goal: Goal) {
  return {
    getById: vi.fn().mockResolvedValue(goal),
    update: vi
      .fn()
      .mockImplementation(async (updatedGoal: Goal) => updatedGoal),
  };
}

function createMockIdeaRepo(idea: Idea) {
  return {
    getById: vi.fn().mockResolvedValue(idea),
    update: vi
      .fn()
      .mockImplementation(async (updatedIdea: Idea) => updatedIdea),
  };
}

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let mockAttachmentRepo: ReturnType<typeof createMockAttachmentRepo>;
    let mockTaskRepo: ReturnType<typeof createMockTaskRepo>;
    let mockChecklistRepo: ReturnType<typeof createMockChecklistRepo>;
    let mockGoalRepo: ReturnType<typeof createMockGoalRepo>;
    let mockIdeaRepo: ReturnType<typeof createMockIdeaRepo>;
    let taskService: TaskService;
    let goalService: GoalService;
    let ideaService: IdeaService;
    const mockClock = { plainDateISO: vi.fn() } as unknown as Clock;

    f.BeforeEachScenario(async () => {
      mockAttachmentRepo = createMockAttachmentRepo();
    });

    function setupTaskService(taskId: string) {
      const task = buildMockTask(taskId);
      mockTaskRepo = createMockTaskRepo(task);
      mockChecklistRepo = createMockChecklistRepo();
      taskService = new TaskService(
        mockTaskRepo as unknown as TaskRepository,
        mockChecklistRepo as unknown as ChecklistRepository,
        mockClock,
        mockAttachmentRepo as unknown as AttachmentRepository,
      );
    }

    function setupGoalService(goalId: string) {
      const goal = buildMockGoal(goalId);
      mockGoalRepo = createMockGoalRepo(goal);
      goalService = new GoalService(
        mockGoalRepo as unknown as GoalRepository,
        mockAttachmentRepo as unknown as AttachmentRepository,
      );
    }

    function setupIdeaService(ideaId: string) {
      const idea = buildMockIdea(ideaId);
      mockIdeaRepo = createMockIdeaRepo(idea);
      ideaService = new IdeaService(
        mockIdeaRepo as unknown as IdeaRepository,
        mockAttachmentRepo as unknown as AttachmentRepository,
      );
    }

    // @add-file-attachments @FR14
    f.Scenario(
      "Deleting a task cascades soft-delete to its attachments",
      ({ Given, When, Then }) => {
        Given('a task "task-1" exists', async (_ctx: TestContext) => {
          setupTaskService("task-1");
        });

        When('the task "task-1" is soft-deleted', async (_ctx: TestContext) => {
          await taskService.softDelete("task-1");
        });

        Then(
          'attachmentRepository.softDeleteByEntityTypeAndId is called with "task" and "task-1"',
          async (_ctx: TestContext) => {
            expect(
              mockAttachmentRepo.softDeleteByEntityTypeAndId,
            ).toHaveBeenCalledWith("task", "task-1");
          },
        );
      },
    );

    // @add-file-attachments @FR15
    f.Scenario(
      "Restoring a task cascades restore to its attachments",
      ({ Given, When, Then }) => {
        Given('a task "task-1" exists', async (_ctx: TestContext) => {
          setupTaskService("task-1");
        });

        When('the task "task-1" is restored', async (_ctx: TestContext) => {
          await taskService.restore("task-1");
        });

        Then(
          'attachmentRepository.restoreByEntityTypeAndId is called with "task" and "task-1"',
          async (_ctx: TestContext) => {
            expect(
              mockAttachmentRepo.restoreByEntityTypeAndId,
            ).toHaveBeenCalledWith("task", "task-1");
          },
        );
      },
    );

    // @add-file-attachments @FR14
    f.Scenario(
      "Deleting a goal cascades soft-delete to its attachments",
      ({ Given, When, Then }) => {
        Given('a goal "goal-1" exists', async (_ctx: TestContext) => {
          setupGoalService("goal-1");
        });

        When('the goal "goal-1" is soft-deleted', async (_ctx: TestContext) => {
          await goalService.softDelete("goal-1");
        });

        Then(
          'attachmentRepository.softDeleteByEntityTypeAndId is called with "goal" and "goal-1"',
          async (_ctx: TestContext) => {
            expect(
              mockAttachmentRepo.softDeleteByEntityTypeAndId,
            ).toHaveBeenCalledWith("goal", "goal-1");
          },
        );
      },
    );

    // @add-file-attachments @FR15
    f.Scenario(
      "Restoring a goal cascades restore to its attachments",
      ({ Given, When, Then }) => {
        Given('a goal "goal-1" exists', async (_ctx: TestContext) => {
          setupGoalService("goal-1");
        });

        When('the goal "goal-1" is restored', async (_ctx: TestContext) => {
          await goalService.restore("goal-1");
        });

        Then(
          'attachmentRepository.restoreByEntityTypeAndId is called with "goal" and "goal-1"',
          async (_ctx: TestContext) => {
            expect(
              mockAttachmentRepo.restoreByEntityTypeAndId,
            ).toHaveBeenCalledWith("goal", "goal-1");
          },
        );
      },
    );

    // @add-file-attachments @FR14
    f.Scenario(
      "Deleting an idea cascades soft-delete to its attachments",
      ({ Given, When, Then }) => {
        Given('an idea "idea-1" exists', async (_ctx: TestContext) => {
          setupIdeaService("idea-1");
        });

        When('the idea "idea-1" is soft-deleted', async (_ctx: TestContext) => {
          await ideaService.softDelete("idea-1");
        });

        Then(
          'attachmentRepository.softDeleteByEntityTypeAndId is called with "idea" and "idea-1"',
          async (_ctx: TestContext) => {
            expect(
              mockAttachmentRepo.softDeleteByEntityTypeAndId,
            ).toHaveBeenCalledWith("idea", "idea-1");
          },
        );
      },
    );

    // @add-file-attachments @FR15
    f.Scenario(
      "Restoring an idea cascades restore to its attachments",
      ({ Given, When, Then }) => {
        Given('an idea "idea-1" exists', async (_ctx: TestContext) => {
          setupIdeaService("idea-1");
        });

        When('the idea "idea-1" is restored', async (_ctx: TestContext) => {
          await ideaService.restore("idea-1");
        });

        Then(
          'attachmentRepository.restoreByEntityTypeAndId is called with "idea" and "idea-1"',
          async (_ctx: TestContext) => {
            expect(
              mockAttachmentRepo.restoreByEntityTypeAndId,
            ).toHaveBeenCalledWith("idea", "idea-1");
          },
        );
      },
    );
  },
);
