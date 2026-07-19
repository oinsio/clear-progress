import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import type { ISODate, ISOTimestamp, Task } from "@/types/entities";
import { HiddenTaskService } from "./HiddenTaskService";

describe("HiddenTaskService", () => {
  let mockTaskRepository: TaskRepository;
  let service: HiddenTaskService;

  beforeEach(() => {
    mockTaskRepository = {
      getTasksToReveal: vi.fn(),
      update: vi.fn(),
    } as unknown as TaskRepository;
  });

  it("should use provided clock to get current date", async () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    service = new HiddenTaskService(mockTaskRepository, clock);

    (
      mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);

    await service.revealHiddenTasks();

    expect(mockTaskRepository.getTasksToReveal).toHaveBeenCalledWith(
      "2026-04-16",
    );
  });

  it("should reveal tasks with appear_date <= current date", async () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    service = new HiddenTaskService(mockTaskRepository, clock);

    const hiddenTask: Task = {
      id: "task-reveal-1",
      name: "Hidden task",
      description: "",
      box: "today",
      goal_id: "",
      context_id: "",
      category_id: "",
      is_completed: false,
      completed_at: "" as ISOTimestamp,
      repeat_rule: "",
      is_hidden: true,
      next_date: "" as ISODate,
      appear_date: "2026-04-15" as ISODate,
      original_task_id: "",
      sort_order: "0",
      is_deleted: false,
      created_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
      updated_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
      revision: 1,
      syncStatus: "synced" as const,
    };

    (
      mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
    ).mockResolvedValue([hiddenTask]);
    (mockTaskRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const revealed = await service.revealHiddenTasks();

    expect(revealed).toHaveLength(1);
    expect(revealed[0].is_hidden).toBe(false);
    expect(mockTaskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-reveal-1",
        is_hidden: false,
        syncStatus: "pending" as const,
      }),
    );
  });

  it("should return empty array when no tasks to reveal", async () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    service = new HiddenTaskService(mockTaskRepository, clock);

    (
      mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);

    const revealed = await service.revealHiddenTasks();

    expect(revealed).toHaveLength(0);
    expect(mockTaskRepository.update).not.toHaveBeenCalled();
  });

  // implements FR4 of day-boundary
  describe("revealHiddenTasks with explicit logicalDate parameter", () => {
    it("should NOT reveal task when appear_date > logicalDate", async () => {
      const clock = fakeClock("2026-06-10T10:00:00Z");
      service = new HiddenTaskService(mockTaskRepository, clock);

      // logicalDate is 2026-06-07, appear_date is 2026-06-08 → should NOT reveal
      (
        mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const revealed = await service.revealHiddenTasks("2026-06-07" as ISODate);

      expect(mockTaskRepository.getTasksToReveal).toHaveBeenCalledWith(
        "2026-06-07",
      );
      expect(revealed).toHaveLength(0);
    });

    it("should reveal task when appear_date <= logicalDate", async () => {
      const clock = fakeClock("2026-06-10T10:00:00Z");
      service = new HiddenTaskService(mockTaskRepository, clock);

      const hiddenTask: Task = {
        id: "task-logical-2",
        name: "Ready hidden task",
        description: "",
        box: "today",
        goal_id: "",
        context_id: "",
        category_id: "",
        is_completed: false,
        completed_at: "" as ISOTimestamp,
        repeat_rule: "",
        is_hidden: true,
        next_date: "" as ISODate,
        appear_date: "2026-06-08" as ISODate,
        original_task_id: "",
        sort_order: "0",
        is_deleted: false,
        created_at: "2026-06-01T10:00:00.000Z" as ISOTimestamp,
        updated_at: "2026-06-01T10:00:00.000Z" as ISOTimestamp,
        revision: 1,
        syncStatus: "synced" as const,
      };

      // logicalDate is 2026-06-08, appear_date is 2026-06-08 → should reveal
      (
        mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
      ).mockResolvedValue([hiddenTask]);
      (mockTaskRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined,
      );

      const revealed = await service.revealHiddenTasks("2026-06-08" as ISODate);

      expect(mockTaskRepository.getTasksToReveal).toHaveBeenCalledWith(
        "2026-06-08",
      );
      expect(revealed).toHaveLength(1);
      expect(revealed[0].is_hidden).toBe(false);
    });

    it("should use clock.plainDateISO() when logicalDate is omitted (backward compat)", async () => {
      const clock = fakeClock("2026-06-10T14:00:00Z");
      service = new HiddenTaskService(mockTaskRepository, clock);

      (
        mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      await service.revealHiddenTasks();

      expect(mockTaskRepository.getTasksToReveal).toHaveBeenCalledWith(
        "2026-06-10",
      );
    });
  });

  // implements FR1 of fix-stale-sync-overwrites
  describe("revealHiddenTasks preserving updated_at", () => {
    it("should NOT modify updated_at when revealing a hidden task", async () => {
      const clock = fakeClock("2026-04-16T10:30:00Z");
      service = new HiddenTaskService(mockTaskRepository, clock);

      const hiddenTask: Task = {
        id: "task-preserve-updated-at-1",
        name: "Hidden task",
        description: "",
        box: "today",
        goal_id: "",
        context_id: "",
        category_id: "",
        is_completed: false,
        completed_at: "" as ISOTimestamp,
        repeat_rule: "",
        is_hidden: true,
        next_date: "" as ISODate,
        appear_date: "2026-04-16" as ISODate,
        original_task_id: "",
        sort_order: "0",
        is_deleted: false,
        created_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
        updated_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
        revision: 1,
        syncStatus: "synced" as const,
      };

      (
        mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
      ).mockResolvedValue([hiddenTask]);
      (mockTaskRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined,
      );

      const revealed = await service.revealHiddenTasks();

      expect(revealed[0].updated_at).toBe("2026-04-15T10:00:00.000Z");
      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "task-preserve-updated-at-1",
          updated_at: "2026-04-15T10:00:00.000Z",
        }),
      );
    });

    it("should set syncStatus to pending when revealing a hidden task", async () => {
      const clock = fakeClock("2026-04-16T10:30:00Z");
      service = new HiddenTaskService(mockTaskRepository, clock);

      const hiddenTask: Task = {
        id: "task-preserve-updated-at-2",
        name: "Hidden task",
        description: "",
        box: "today",
        goal_id: "",
        context_id: "",
        category_id: "",
        is_completed: false,
        completed_at: "" as ISOTimestamp,
        repeat_rule: "",
        is_hidden: true,
        next_date: "" as ISODate,
        appear_date: "2026-04-16" as ISODate,
        original_task_id: "",
        sort_order: "0",
        is_deleted: false,
        created_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
        updated_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
        revision: 1,
        syncStatus: "synced" as const,
      };

      (
        mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
      ).mockResolvedValue([hiddenTask]);
      (mockTaskRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined,
      );

      const revealed = await service.revealHiddenTasks();

      expect(revealed[0].syncStatus).toBe("pending");
      expect(revealed[0].is_hidden).toBe(false);
    });

    it("should keep syncStatus as pending without degrading state when task is already pending", async () => {
      const clock = fakeClock("2026-04-16T10:30:00Z");
      service = new HiddenTaskService(mockTaskRepository, clock);

      const alreadyPendingHiddenTask: Task = {
        id: "task-preserve-updated-at-3",
        name: "Hidden task already pending",
        description: "",
        box: "today",
        goal_id: "",
        context_id: "",
        category_id: "",
        is_completed: false,
        completed_at: "" as ISOTimestamp,
        repeat_rule: "",
        is_hidden: true,
        next_date: "" as ISODate,
        appear_date: "2026-04-16" as ISODate,
        original_task_id: "",
        sort_order: "0",
        is_deleted: false,
        created_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
        updated_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
        revision: 1,
        syncStatus: "pending" as const,
      };

      (
        mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
      ).mockResolvedValue([alreadyPendingHiddenTask]);
      (mockTaskRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined,
      );

      const revealed = await service.revealHiddenTasks();

      expect(revealed[0].syncStatus).toBe("pending");
      expect(revealed[0].updated_at).toBe("2026-04-15T10:00:00.000Z");
    });
  });
});
