import { SHEET_HEADERS, SHEET_NAMES } from "../helpers/constants";

export { makeSheetMock } from "./make-sheet-mock";

export const IDEA_HEADERS = SHEET_HEADERS[SHEET_NAMES.IDEAS];

export function makeIdeaRow(
  overrides: Partial<Record<string, unknown>> = {},
): unknown[] {
  const defaults: Record<string, unknown> = {
    id: "idea-1",
    name: "My Idea",
    description: "A great idea",
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    revision: 0,
  };
  const merged = { ...defaults, ...overrides };
  return IDEA_HEADERS.map((col) => merged[col]);
}
