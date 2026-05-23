import { vi } from "vitest";
import { SHEET_HEADERS, SHEET_NAMES } from "../helpers/constants";
import { getSheet } from "./client";
import { makeSheetMock } from "./make-sheet-mock";

export { makeSheetMock } from "./make-sheet-mock";

export const TASK_HEADERS = SHEET_HEADERS[SHEET_NAMES.TASKS];
export const NUM_TASK_COLS = TASK_HEADERS.length;

export const TASK_COL = TASK_HEADERS.reduce<Record<string, number>>(
  (acc, col, i) => {
    acc[col] = i;
    return acc;
  },
  {},
);

export function makeTaskRow(
  id: string,
  overrides: Record<string, unknown> = {},
): unknown[] {
  const row = Array(NUM_TASK_COLS).fill("");
  row[TASK_COL.id] = id;
  for (const [key, value] of Object.entries(overrides)) {
    row[TASK_COL[key]] = value;
  }
  return row;
}

export function setupSheet(rows: unknown[][] = []) {
  const sheetMock = makeSheetMock(rows);
  vi.mocked(getSheet).mockReturnValue(sheetMock as never);
  return sheetMock;
}

export function setupSheetWithTasks(...ids: string[]) {
  return setupSheet([TASK_HEADERS, ...ids.map((id) => makeTaskRow(id))]);
}
