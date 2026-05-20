import { SHEET_HEADERS, SHEET_NAMES } from "../helpers/constants";

export { makeSheetMock } from "./make-sheet-mock";

export const ITEM_HEADERS = SHEET_HEADERS[SHEET_NAMES.CHECKLIST_ITEMS];

export function makeItemRow(
  overrides: Partial<Record<string, unknown>> = {},
): unknown[] {
  const defaults: Record<string, unknown> = {
    id: "item-1",
    task_id: "task-1",
    name: "Subtask",
    is_completed: false,
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  };
  const merged = { ...defaults, ...overrides };
  return ITEM_HEADERS.map((col) => merged[col]);
}
