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

  async function testHiddenFieldAfterComplete(
    nextDate: string,
    appearDate: string,
    advanceDays: number,
    expectedHidden: boolean,
    clock?: ReturnType<typeof fakeClock>,
    logicalDate?: string,
    interval: number = 1,
  ) {
    const service = clock
      ? new TaskService(mockTaskRepository, mockChecklistRepository, clock)
      : taskService;

    const repeatRule = {
      type: "fixed" as const,
      frequency: "daily" as const,
      interval,
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

    await service.complete("task-1", logicalDate);

    const createdTask = getCreatedTask();
    expect(createdTask).toBeDefined();
    expect(createdTask?.is_hidden).toBe(expectedHidden);
  }

  describe("Revealing hidden recurring tasks immediately", () => {
    it("should reveal hidden clone immediately when appear_date <= today", async () => {
      await testHiddenFieldAfterComplete("2026-04-19", "2026-04-19", 2, false);
    });

    it("should keep hidden clone hidden when appear_date in future", async () => {
      // daily interval=1: next=today+1=Apr 21, appear=Apr 21-5=Apr 16 <= Apr 20 → revealed.
      // Use interval=10 so next=Apr 30, appear=Apr 30-5=Apr 25 > Apr 20 → hidden.
      const clock = fakeClock("2026-04-20T10:00:00Z");
      await testHiddenFieldAfterComplete(
        "2026-05-01",
        "2026-04-26",
        5,
        true,
        clock,
        undefined,
        10,
      );
    });

    it("should reveal hidden clone when appear_date equals today", async () => {
      // daily interval=1: next=today+1=Apr 21, appear=Apr 21-1=Apr 20 = today → revealed.
      const clock = fakeClock("2026-04-20T10:00:00Z");
      await testHiddenFieldAfterComplete(
        "2026-04-20",
        "2026-04-20",
        1,
        false,
        clock,
      );
    });

    async function testHiddenFieldAfterCompleteWithExistingCopy(
      nextDate: string,
      appearDate: string,
      copyNextDate: string,
      copyAppearDate: string,
      advanceDays: number,
      expectedHidden: boolean,
      clock?: ReturnType<typeof fakeClock>,
      interval: number = 1,
    ) {
      const service = clock
        ? new TaskService(mockTaskRepository, mockChecklistRepository, clock)
        : taskService;

      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval,
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

      const existingHiddenCopy = buildTask({
        id: "task-2",
        name: "Old name",
        original_task_id: "task-1",
        is_hidden: true,
        next_date: toISODate(copyNextDate),
        appear_date: toISODate(copyAppearDate),
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

      await service.complete("task-1");

      const updatedCopy = getUpdatedCopy();
      expect(updatedCopy).toBeDefined();
      expect(updatedCopy?.is_hidden).toBe(expectedHidden);
    }

    it("should reveal updated hidden clone when appear_date <= today", async () => {
      await testHiddenFieldAfterCompleteWithExistingCopy(
        "2026-04-19",
        "2026-04-19",
        "2026-04-18",
        "2026-04-18",
        2,
        false,
      );
    });

    it("should keep updated hidden clone hidden when appear_date in future", async () => {
      // interval=10: next=Apr 30, appear=Apr 30-5=Apr 25 > Apr 20 → hidden
      const clock = fakeClock("2026-04-20T10:00:00Z");
      await testHiddenFieldAfterCompleteWithExistingCopy(
        "2026-05-01",
        "2026-04-26",
        "2026-04-25",
        "2026-04-25",
        5,
        true,
        clock,
        10,
      );
    });
  });

  describe("logicalDate parameter for day boundary — FR7 of day-boundary", () => {
    it("should use logicalDate for shouldReveal when provided", async () => {
      // Day boundary is "02:00", current wall-clock is 01:30 on June 5
      // → logical date is June 4.
      // Daily rule with next_date June 5: calculateNextDate → June 6,
      // advance_days=1 → appear_date = June 5.
      // With logicalDate June 4: appear_date (June 5) > logicalDate (June 4) → hidden.
      const clock = fakeClock("2026-06-05T01:30:00Z");
      await testHiddenFieldAfterComplete(
        "2026-06-05",
        "2026-06-04",
        1,
        true,
        clock,
        "2026-06-04",
      );
    });

    it("should fall back to clock date when logicalDate is omitted", async () => {
      // Clock says June 5.
      // Daily rule with next_date June 5: calculateNextDate → June 6,
      // advance_days=1 → appear_date = June 5.
      // Without logicalDate: appear_date (June 5) <= clock date (June 5) → revealed.
      const clock = fakeClock("2026-06-05T10:00:00Z");
      await testHiddenFieldAfterComplete(
        "2026-06-05",
        "2026-06-04",
        1,
        false,
        clock,
      );
    });
  });
});
