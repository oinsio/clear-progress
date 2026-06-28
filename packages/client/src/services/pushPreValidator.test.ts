// implements FR5 of fix-push-poison-pill
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RECORD_SYNC_STATUS } from "@/constants";
import { fakeClock } from "@/lib/temporal";
import type { Goal, Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { preValidateRecords } from "./pushPreValidator";

const FIXED_CLOCK = fakeClock("2026-06-27T10:00:00Z");
const FIXED_TIMESTAMP = toISOTimestamp(FIXED_CLOCK);

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
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
    sort_order: "a0",
    is_deleted: false,
    created_at: FIXED_TIMESTAMP,
    updated_at: FIXED_TIMESTAMP,
    revision: 0,
    syncStatus: RECORD_SYNC_STATUS.PENDING,
    ...overrides,
  } as Task;
}

function buildGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: crypto.randomUUID(),
    name: "Test goal",
    description: "",
    cover_hash: "",
    status: "planning",
    sort_order: "a0",
    is_deleted: false,
    created_at: FIXED_TIMESTAMP,
    updated_at: FIXED_TIMESTAMP,
    revision: 0,
    syncStatus: RECORD_SYNC_STATUS.PENDING,
    ...overrides,
  } as Goal;
}

function createMockRepositories() {
  return {
    taskRepository: { update: vi.fn() },
    goalRepository: { update: vi.fn() },
    contextRepository: { update: vi.fn() },
    categoryRepository: { update: vi.fn() },
    checklistRepository: { update: vi.fn() },
    ideaRepository: { update: vi.fn() },
    attachmentRepository: { update: vi.fn() },
  };
}

describe("preValidateRecords", () => {
  let repositories: ReturnType<typeof createMockRepositories>;

  beforeEach(() => {
    repositories = createMockRepositories();
  });

  it("should pass through valid records unchanged", async () => {
    const validTask = buildTask();
    const result = await preValidateRecords(
      [validTask],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      repositories,
    );

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toBe(validTask);
    expect(result.alerts).toEqual([]);
    expect(repositories.taskRepository.update).not.toHaveBeenCalled();
  });

  it("should heal records and update DB with pending status", async () => {
    const taskWithBadFk = buildTask({ goal_id: "not-a-uuid" as string });
    const result = await preValidateRecords(
      [taskWithBadFk],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      repositories,
    );

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].goal_id).toBe("");
    expect(result.tasks[0].syncStatus).toBe(RECORD_SYNC_STATUS.PENDING);
    expect(repositories.taskRepository.update).toHaveBeenCalledOnce();
  });

  it("should exclude rejected records and mark as rejected in DB", async () => {
    const taskWithBadId = buildTask({ id: "not-a-uuid" as string });
    const result = await preValidateRecords(
      [taskWithBadId],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      repositories,
    );

    expect(result.tasks).toHaveLength(0);
    expect(repositories.taskRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        syncStatus: RECORD_SYNC_STATUS.REJECTED,
      }),
    );
  });

  it("should collect alerts from healed records", async () => {
    const taskWithEmptyName = buildTask({ name: "" as string });
    const result = await preValidateRecords(
      [taskWithEmptyName],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      repositories,
    );

    expect(result.tasks).toHaveLength(1);
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].messageKey).toBe("sync.alert.name_set_untitled");
  });

  it("should handle multiple entity types", async () => {
    const validTask = buildTask();
    const validGoal = buildGoal();
    const result = await preValidateRecords(
      [validTask],
      [validGoal],
      [],
      [],
      [],
      [],
      [],
      [],
      repositories,
    );

    expect(result.tasks).toHaveLength(1);
    expect(result.goals).toHaveLength(1);
  });

  it("should pass settings through without validation", async () => {
    const settings = [
      {
        key: "theme",
        value: "dark",
        updated_at: FIXED_TIMESTAMP,
        syncStatus: RECORD_SYNC_STATUS.PENDING,
      },
    ];
    const result = await preValidateRecords(
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      settings as never[],
      repositories,
    );

    expect(result.settings).toEqual(settings);
  });

  it("should use raw Dexie fallback when repository update throws", async () => {
    const taskWithBadId = buildTask({ id: "not-a-uuid" as string });
    repositories.taskRepository.update.mockRejectedValueOnce(
      new Error("Schema validation failed"),
    );

    // Mock the dynamic import of database
    const mockTable = { update: vi.fn() };
    const mockDb = { table: vi.fn().mockReturnValue(mockTable) };
    vi.doMock("@/db/database", () => ({ db: mockDb }));

    const result = await preValidateRecords(
      [taskWithBadId],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      repositories,
    );

    expect(result.tasks).toHaveLength(0);
  });
});
