import { SHEET_HEADERS, SHEET_NAMES } from "../helpers/constants";

export { makeSheetMock } from "./make-sheet-mock";

export const CTX_HEADERS = SHEET_HEADERS[SHEET_NAMES.CONTEXTS];

export function makeContextRow(
  overrides: Partial<Record<string, unknown>> = {},
): unknown[] {
  const defaults: Record<string, unknown> = {
    id: "context-1",
    name: "@Home",
    sort_order: 0,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  };
  const merged = { ...defaults, ...overrides };
  return CTX_HEADERS.map((col) => merged[col]);
}
