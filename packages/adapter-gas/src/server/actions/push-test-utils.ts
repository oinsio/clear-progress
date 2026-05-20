import { beforeEach, expect, it, vi } from "vitest";
import {
  expectErrorResponse,
  expectValidServerTime,
  getResults,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeTask,
  parseResponse,
  setupEmptySheets,
} from "../../../tests/server/helpers";
import { getMockLock } from "../../../tests/server/setup/gas-mocks";
import { PUSH_STATUSES } from "../helpers/constants";
import { getAllCategories } from "../sheets/categories.sheet";
import { getAllChecklistItems } from "../sheets/checklists.sheet";
import { getAllContexts } from "../sheets/contexts.sheet";
import { getAllGoals } from "../sheets/goals.sheet";
import { readNextRevision } from "../sheets/meta.sheet";
import { getAllSettings } from "../sheets/settings.sheet";
import { getAllTasks } from "../sheets/tasks.sheet";
import type { ChecklistItem, Goal, Task } from "../types";
import { push } from "./push";

export {
  expectErrorResponse,
  expectValidServerTime,
  getMockLock,
  getResults,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeTask,
  parseResponse,
  setupEmptySheets,
};

export function setupPushTests(): void {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEmptySheets({
      getAllTasks,
      getAllGoals,
      getAllContexts,
      getAllCategories,
      getAllChecklistItems,
      getAllSettings,
    });
    vi.mocked(readNextRevision).mockReturnValue(1);
    getMockLock().tryLock.mockReturnValue(true);
    getMockLock().releaseLock.mockReset();
  });
}

export function assertMixedTaskBatch(validTask: Task, invalidTask: Task): void {
  push({ tasks: [validTask, invalidTask] });
  const results = getResults();
  expect(results.tasks).toHaveLength(2);
  expect(results.tasks?.[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
  expect(results.tasks?.[1]).toMatchObject({ status: PUSH_STATUSES.REJECTED });
}

export function assertRejectedTaskWithCreatedGoal(
  invalidTask: Task,
  validGoal: Goal,
): void {
  push({ tasks: [invalidTask], goals: [validGoal] });
  const results = getResults();
  expect(results.tasks?.[0]).toMatchObject({ status: PUSH_STATUSES.REJECTED });
  expect(results.goals?.[0]).toMatchObject({ status: PUSH_STATUSES.CREATED });
}

export function describeCommonRejectionTests(
  makeInvalidTask: () => Task,
  makeValidTask: () => Task,
): void {
  it("should include reason field in rejected result", () => {
    push({ tasks: [makeInvalidTask()] });
    const results = getResults();
    expect(results.tasks![0]).toHaveProperty("reason");
  });

  it("should process valid records alongside rejected ones in same array", () => {
    assertMixedTaskBatch(makeValidTask(), makeInvalidTask());
  });

  it("should handle rejected task and created goal in same push", () => {
    assertRejectedTaskWithCreatedGoal(
      makeInvalidTask(),
      makeGoal({
        id: "f7a8b9c0-d1e2-4f34-9a5b-6c7d8e9f0a1b",
        name: "Valid goal",
      }),
    );
  });
}

export function assertTaskStatus(
  taskOverrides: Partial<Task>,
  expectedStatus: string,
): void {
  const task = makeTask(taskOverrides);
  push({ tasks: [task] });
  const results = getResults();
  expect(results.tasks![0]).toMatchObject({ status: expectedStatus });
}

export function assertChecklistItemStatus(
  itemOverrides: Partial<ChecklistItem>,
  expectedStatus: string,
): void {
  const item = makeChecklistItem(itemOverrides);
  push({ checklist_items: [item] });
  const results = getResults();
  expect(results.checklist_items![0]).toMatchObject({ status: expectedStatus });
}

export function assertTaskHasReason(taskOverrides: Partial<Task>): void {
  const task = makeTask(taskOverrides);
  push({ tasks: [task] });
  const results = getResults();
  expect(results.tasks![0]).toHaveProperty("reason");
}

export function assertChecklistItemHasReason(
  itemOverrides: Partial<ChecklistItem>,
): void {
  const item = makeChecklistItem(itemOverrides);
  push({ checklist_items: [item] });
  const results = getResults();
  expect(results.checklist_items![0]).toHaveProperty("reason");
}

export function pushAcceptedTaskScenario(): void {
  const serverTask = makeTask({
    id: "11111111-1111-4111-a111-111111111111",
    updated_at: "2025-01-01T00:00:00.000Z",
  });
  const clientTask = makeTask({
    id: "11111111-1111-4111-a111-111111111111",
    updated_at: "2025-01-02T00:00:00.000Z",
  });
  vi.mocked(getAllTasks).mockReturnValue([serverTask]);
  push({ tasks: [clientTask] });
}

export function pushConflictTaskScenario(): { serverTask: Task } {
  const serverTask = makeTask({
    id: "11111111-1111-4111-a111-111111111111",
    updated_at: "2025-01-02T00:00:00.000Z",
  });
  const clientTask = makeTask({
    id: "11111111-1111-4111-a111-111111111111",
    updated_at: "2025-01-01T00:00:00.000Z",
  });
  vi.mocked(getAllTasks).mockReturnValue([serverTask]);
  push({ tasks: [clientTask] });
  return { serverTask };
}
