import { expect, vi } from "vitest";
import { ERROR_CODES } from "../../../src/server/helpers/response";
import type {
  Category,
  ChecklistItem,
  Context,
  Goal,
  Setting,
  Task,
} from "../../../src/server/types";
import { parseResponse } from "./response";

export function expectErrorResponse(errorCode: string) {
  const response = parseResponse();
  expect(response.ok).toBe(false);
  expect(response.error).toBe(errorCode);
}

export function expectSuccessResponse() {
  const response = parseResponse();
  expect(response.ok).toBe(true);
  return response;
}

export function expectInvalidPayloadError() {
  expectErrorResponse(ERROR_CODES.INVALID_PAYLOAD);
}

export function expectInternalError() {
  expectErrorResponse(ERROR_CODES.INTERNAL_ERROR);
}

export function createMockEntity(id: string, isDeleted: boolean) {
  return { id, is_deleted: isDeleted } as never;
}

export function createMockEntityWithRevision(id: string, revision: number) {
  return { id, revision } as never;
}

export function expectPullResponseStructure() {
  const response = expectSuccessResponse();
  expect(response).toHaveProperty("tasks");
  expect(response).toHaveProperty("goals");
  expect(response).toHaveProperty("contexts");
  expect(response).toHaveProperty("categories");
  expect(response).toHaveProperty("checklist_items");
  expect(response).toHaveProperty("ideas");
  return response;
}

export function expectValidServerTime() {
  const serverTime = parseResponse().server_time as string;
  expect(() => new Date(serverTime).toISOString()).not.toThrow();
  expect(serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
}

// Factory functions for push tests
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "11111111-1111-4111-a111-111111111111",
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
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    revision: 0,
    ...overrides,
  };
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "22222222-2222-4222-a222-222222222222",
    name: "Test goal",
    description: "",
    cover_hash: "",
    status: "planning",
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    revision: 0,
    ...overrides,
  };
}

export function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    id: "33333333-3333-4333-a333-333333333333",
    name: "@Home",
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    revision: 0,
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "44444444-4444-4444-a444-444444444444",
    name: "Work",
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    revision: 0,
    ...overrides,
  };
}

export function makeChecklistItem(
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  return {
    id: "55555555-5555-4555-a555-555555555555",
    task_id: "11111111-1111-4111-a111-111111111111",
    name: "Subtask",
    is_completed: false,
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    revision: 0,
    ...overrides,
  };
}

// Setup helpers for push tests
export function setupEmptySheets(mocks: {
  getAllTasks: () => Task[];
  getAllGoals: () => Goal[];
  getAllContexts: () => Context[];
  getAllCategories: () => Category[];
  getAllChecklistItems: () => ChecklistItem[];
  getAllSettings: () => Setting[];
}): void {
  vi.mocked(mocks.getAllTasks).mockReturnValue([]);
  vi.mocked(mocks.getAllGoals).mockReturnValue([]);
  vi.mocked(mocks.getAllContexts).mockReturnValue([]);
  vi.mocked(mocks.getAllCategories).mockReturnValue([]);
  vi.mocked(mocks.getAllChecklistItems).mockReturnValue([]);
  vi.mocked(mocks.getAllSettings).mockReturnValue([]);
}
