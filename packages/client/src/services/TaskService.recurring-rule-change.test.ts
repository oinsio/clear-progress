// implements FR1, G3 of repeating-task-rule-change
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskRepository } from "@/test/mocks/taskRepositoryMock";
import { TaskService } from "./TaskService";
import { setupCreateTaskCapture } from "./TaskService.recurring-test-helpers";

const DAILY_FIXED_INTERVAL_5 = {
  type: "fixed" as const,
  frequency: "daily" as const,
  interval: 5,
  target_box: "today" as const,
  advance_days: 0,
};

const AFTER_COMPLETION_DELAY_7 = {
  type: "after_completion" as const,
  delay_days: 7,
  target_box: "today" as const,
  advance_days: 0,
};

describe("TaskService - Rule Change then Complete", () => {
  let taskService: TaskService;
  let mockTaskRepository: TaskRepository;
  let mockChecklistRepository: ChecklistRepository;

  beforeEach(() => {
    mockTaskRepository = createMockTaskRepository();
    mockChecklistRepository = createMockChecklistRepository();
    vi.clearAllMocks();
  });

  it("should calculate next_date from updated rule after same-day completion", async () => {
    const clock = fakeClock("2026-06-08T10:00:00Z");
    taskService = new TaskService(
      mockTaskRepository,
      mockChecklistRepository,
      clock,
    );

    // Task already has updated rule (daily interval=5) and recalculated next_date
    // simulating what handleRepeatChange does when rule changes on 2026-06-08
    const task = buildTask({
      id: "task-1",
      name: "Daily review",
      repeat_rule: JSON.stringify(DAILY_FIXED_INTERVAL_5),
      next_date: "2026-06-13",
      appear_date: "2026-06-13",
    });

    const completedTask = buildTask({
      ...task,
      is_completed: true,
      completed_at: "2026-06-08T10:00:00.000Z",
    });

    const getCreatedTask = setupCreateTaskCapture(
      mockTaskRepository,
      task,
      completedTask,
      mockChecklistRepository,
    );

    await taskService.complete("task-1");

    const createdTask = getCreatedTask();
    // Daily with today+interval: 2026-06-08 + 5 = 2026-06-13
    expect(createdTask?.next_date).toBe("2026-06-13");
  });

  it("should calculate next_date from updated rule when completed days later", async () => {
    const clock = fakeClock("2026-06-10T10:00:00Z");
    taskService = new TaskService(
      mockTaskRepository,
      mockChecklistRepository,
      clock,
    );

    // Rule changed on 2026-06-08, next_date was recalculated to 2026-06-13
    // User completes on 2026-06-10 (2 days later)
    const task = buildTask({
      id: "task-1",
      name: "Daily review",
      repeat_rule: JSON.stringify(DAILY_FIXED_INTERVAL_5),
      next_date: "2026-06-13",
      appear_date: "2026-06-13",
    });

    const completedTask = buildTask({
      ...task,
      is_completed: true,
      completed_at: "2026-06-10T10:00:00.000Z",
    });

    const getCreatedTask = setupCreateTaskCapture(
      mockTaskRepository,
      task,
      completedTask,
      mockChecklistRepository,
    );

    await taskService.complete("task-1");

    const createdTask = getCreatedTask();
    // Daily with today+interval: 2026-06-10 + 5 = 2026-06-15
    expect(createdTask?.next_date).toBe("2026-06-15");
  });

  it("should calculate next_date from completedAt when rule changed to after_completion", async () => {
    const clock = fakeClock("2026-06-10T10:00:00Z");
    taskService = new TaskService(
      mockTaskRepository,
      mockChecklistRepository,
      clock,
    );

    // Rule changed to after_completion on 2026-06-08, next_date set to ""
    // User completes on 2026-06-10
    const task = buildTask({
      id: "task-1",
      name: "Water plants",
      repeat_rule: JSON.stringify(AFTER_COMPLETION_DELAY_7),
      next_date: "",
      appear_date: "",
    });

    const completedTask = buildTask({
      ...task,
      is_completed: true,
      completed_at: "2026-06-10T10:00:00.000Z",
    });

    const getCreatedTask = setupCreateTaskCapture(
      mockTaskRepository,
      task,
      completedTask,
      mockChecklistRepository,
    );

    await taskService.complete("task-1");

    const createdTask = getCreatedTask();
    // completedAt 2026-06-10 + 7 days = 2026-06-17
    expect(createdTask?.next_date).toBe("2026-06-17");
  });
});
