/// <reference lib="esnext" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { upsertRecords } from "./base";
import {
  makeTaskRow,
  NUM_TASK_COLS,
  setupSheet,
  setupSheetWithTasks,
  TASK_COL,
  TASK_HEADERS,
} from "./base-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("upsertRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do nothing when records array is empty", () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, []);

    expect(sheetMock.getDataRange).not.toHaveBeenCalled();
    expect(sheetMock.appendRow).not.toHaveBeenCalled();
    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it("should read the sheet exactly once regardless of record count", () => {
    const sheetMock = setupSheetWithTasks("task-1", "task-2", "task-3");

    upsertRecords(SHEET_NAMES.TASKS, [
      { id: "task-1" },
      { id: "task-2" },
      { id: "task-3" },
    ]);

    expect(sheetMock.getDataRange).toHaveBeenCalledTimes(1);
  });

  it("should call appendRow for each new record when sheet is empty", () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, [
      { id: "new-1" },
      { id: "new-2" },
      { id: "new-3" },
    ]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(3);
  });

  it("should not call setValues when all records are new", () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: "new-1" }, { id: "new-2" }]);

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it("should call setValues separately for each existing record update", () => {
    const sheetMock = setupSheetWithTasks("task-1", "task-2", "task-3");

    upsertRecords(SHEET_NAMES.TASKS, [
      { id: "task-1", title: "A" },
      { id: "task-2", title: "B" },
      { id: "task-3", title: "C" },
    ]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(3);
    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it("should write only the updated row, not the full data range", () => {
    // Row 2 in 1-based indexing (header is row 1, task-1 is row 2)
    const sheetMock = setupSheetWithTasks("task-1", "task-2");

    upsertRecords(SHEET_NAMES.TASKS, [{ id: "task-1" }]);

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_TASK_COLS);
  });

  it("should write updated data into the correct row", () => {
    const sheetMock = setupSheet([
      TASK_HEADERS,
      makeTaskRow("task-1", { name: "Old" }),
      makeTaskRow("task-2", { name: "Keep" }),
    ]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: "task-1", name: "New" }]);

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[TASK_COL.name]).toBe("New");
  });

  it("should handle mixed batch: update existing + append new", () => {
    const sheetMock = setupSheetWithTasks("task-existing");

    upsertRecords(SHEET_NAMES.TASKS, [
      { id: "task-existing", name: "Updated" },
      { id: "task-new", name: "Created" },
    ]);

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it("should append new rows with correct data", () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: "task-new", name: "My new task" }]);

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[TASK_COL.id]).toBe("task-new");
    expect(appendedRow[TASK_COL.name]).toBe("My new task");
  });

  it("should call getSheet with the given sheet name", () => {
    setupSheet([TASK_HEADERS]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: "x" }]);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });

  it("should append a new record when the sheet has an empty-id row", () => {
    // Empty row (blank first column) should NOT be treated as an existing record
    const emptyRow = Array(NUM_TASK_COLS).fill("");
    const sheetMock = setupSheet([TASK_HEADERS, emptyRow]);

    upsertRecords(SHEET_NAMES.TASKS, [{ id: "new-task" }]);

    // Record not found in idToRowIndex → should be appended, not update the empty row
    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).not.toHaveBeenCalled();
  });
});
