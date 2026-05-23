import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskRepository } from "@/test/mocks/taskRepositoryMock";
import { toISODate, toISOTimestamp } from "@/utils/dateHelpers";
import { TaskService } from "./TaskService";
import {
  setupCreateTaskCapture,
  setupUpdateTaskCapture,
} from "./TaskService.recurring-test-helpers";

describe("TaskService - Recurring Tasks Integration", () => {
  let taskService: TaskService;
  let mockTaskRepository: TaskRepository;
  let mockChecklistRepository: ChecklistRepository;

  beforeEach(() => {
    mockTaskRepository = createMockTaskRepository();
    mockChecklistRepository = createMockChecklistRepository();
    taskService = new TaskService(mockTaskRepository, mockChecklistRepository);
    vi.clearAllMocks();
  });

  describe("Revealing hidden recurring tasks immediately", () => {
    async function testHiddenFieldAfterComplete(
      nextDate: string,
      appearDate: string,
      advanceDays: number,
      expectedHidden: boolean,
      clock?: ReturnType<typeof fakeClock>,
    ) {
      const service = clock
        ? new TaskService(mockTaskRepository, mockChecklistRepository, clock)
        : taskService;

      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: advanceDays,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Daily task",
        repeat_rule: JSON.stringify(repeatRule),
        next_date: toISODate(nextDate),
        appear_date: toISODate(appearDate),
      });

      const completedTask = buildTask({
        ...existingTask,
        is_completed: true,
        completed_at: toISOTimestamp(),
      });

      const getCreatedTask = setupCreateTaskCapture(
        mockTaskRepository,
        existingTask,
        completedTask,
        mockChecklistRepository,
      );

      await service.complete("task-1");

      const createdTask = getCreatedTask();
      expect(createdTask).toBeDefined();
      expect(createdTask?.is_hidden).toBe(expectedHidden);
    }

    it("should reveal hidden clone immediately when appear_date <= today", async () => {
      await testHiddenFieldAfterComplete("2026-04-19", "2026-04-19", 2, false);
    });

    it("should keep hidden clone hidden when appear_date in future", async () => {
      const clock = fakeClock("2026-04-20T10:00:00Z");
      await testHiddenFieldAfterComplete(
        "2026-05-01",
        "2026-04-26",
        5,
        true,
        clock,
      );
    });

    it("should reveal hidden clone when appear_date equals today", async () => {
      await testHiddenFieldAfterComplete("2026-04-20", "2026-04-20", 0, false);
    });

    it("should reveal updated hidden clone when appear_date <= today", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 2,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Daily task",
        repeat_rule: JSON.stringify(repeatRule),
        next_date: toISODate("2026-04-19"),
        appear_date: toISODate("2026-04-19"),
      });

      const existingHiddenCopy = buildTask({
        id: "task-2",
        name: "Old name",
        original_task_id: "task-1",
        is_hidden: true,
        next_date: toISODate("2026-04-18"),
        appear_date: toISODate("2026-04-18"),
      });

      const tasksById: Record<string, ReturnType<typeof buildTask>> = {
        "task-1": existingTask,
        "task-2": existingHiddenCopy,
      };

      const getUpdatedCopy = setupUpdateTaskCapture(
        mockTaskRepository,
        tasksById,
        mockChecklistRepository,
        existingHiddenCopy,
      );

      await taskService.complete("task-1");

      const updatedCopy = getUpdatedCopy();
      expect(updatedCopy).toBeDefined();
      expect(updatedCopy?.is_hidden).toBe(false);
    });

    it("should keep updated hidden clone hidden when appear_date in future", async () => {
      const clock = fakeClock("2026-04-20T10:00:00Z");
      taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
        clock,
      );

      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 5,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Daily task",
        repeat_rule: JSON.stringify(repeatRule),
        next_date: toISODate("2026-05-01"),
        appear_date: toISODate("2026-04-26"),
      });

      const existingHiddenCopy = buildTask({
        id: "task-2",
        name: "Old name",
        original_task_id: "task-1",
        is_hidden: true,
        next_date: toISODate("2026-04-25"),
        appear_date: toISODate("2026-04-25"),
      });

      const tasksById: Record<string, ReturnType<typeof buildTask>> = {
        "task-1": existingTask,
        "task-2": existingHiddenCopy,
      };

      const getUpdatedCopy = setupUpdateTaskCapture(
        mockTaskRepository,
        tasksById,
        mockChecklistRepository,
        existingHiddenCopy,
      );

      await taskService.complete("task-1");

      const updatedCopy = getUpdatedCopy();
      expect(updatedCopy).toBeDefined();
      expect(updatedCopy?.is_hidden).toBe(true);
    });
  });
});
