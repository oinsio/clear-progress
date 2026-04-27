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
      sort_order: 0,
      is_deleted: false,
      created_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
      updated_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
      version: 1,
      revision: 1,
      needsSync: false,
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
    expect(revealed[0].version).toBe(2);
    expect(mockTaskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-reveal-1",
        is_hidden: false,
        version: 2,
        needsSync: true,
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

  it("should increment version and set needsSync when revealing", async () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    service = new HiddenTaskService(mockTaskRepository, clock);

    const hiddenTask: Task = {
      id: "task-version-1",
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
      sort_order: 0,
      is_deleted: false,
      created_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
      updated_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
      version: 5,
      revision: 1,
      needsSync: false,
    };

    (
      mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
    ).mockResolvedValue([hiddenTask]);
    (mockTaskRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const revealed = await service.revealHiddenTasks();

    expect(revealed[0].version).toBe(6);
    expect(revealed[0].needsSync).toBe(true);
  });

  it("should update updated_at timestamp when revealing", async () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    service = new HiddenTaskService(mockTaskRepository, clock);

    const hiddenTask: Task = {
      id: "task-timestamp-1",
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
      sort_order: 0,
      is_deleted: false,
      created_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
      updated_at: "2026-04-15T10:00:00.000Z" as ISOTimestamp,
      version: 1,
      revision: 1,
      needsSync: false,
    };

    (
      mockTaskRepository.getTasksToReveal as ReturnType<typeof vi.fn>
    ).mockResolvedValue([hiddenTask]);
    (mockTaskRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const revealed = await service.revealHiddenTasks();

    expect(revealed[0].updated_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(revealed[0].updated_at).not.toBe("2026-04-15T10:00:00.000Z");
  });
});
