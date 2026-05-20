import { SHEET_HEADERS, SHEET_NAMES } from "../helpers/constants";

export { makeSheetMock } from "./make-sheet-mock";

export const GOAL_HEADERS = SHEET_HEADERS[SHEET_NAMES.GOALS];

export function makeGoalRow(
  overrides: Partial<Record<string, unknown>> = {},
): unknown[] {
  const defaults: Record<string, unknown> = {
    id: "goal-1",
    name: "Test goal",
    description: "",
    cover_file_id: "",
    status: "planning",
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  };
  const merged = { ...defaults, ...overrides };
  return GOAL_HEADERS.map((col) => merged[col]);
}
