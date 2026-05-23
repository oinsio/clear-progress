import { SHEET_HEADERS, SHEET_NAMES } from "../helpers/constants";

export { makeSheetMock } from "./make-sheet-mock";

export const TASK_HEADERS = SHEET_HEADERS[SHEET_NAMES.TASKS];

export function makeTaskRow(
  overrides: Partial<Record<string, unknown>> = {},
): unknown[] {
  const defaults: Record<string, unknown> = {
    id: "task-1",
    name: "Test task",
    description: "",
    box: "inbox",
    goal_id: "",
    context_id: "",
    category_id: "",
    is_completed: false,
    completed_at: "",
    repeat_rule: "",
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  };
  const merged = { ...defaults, ...overrides };
  return TASK_HEADERS.map((col) => merged[col]);
}
