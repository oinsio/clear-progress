/// <reference lib="esnext" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { upsertRecord } from "./base";
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

describe("upsertRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when id is not found in sheet", () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecord(SHEET_NAMES.TASKS, { id: "new-id" });

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it("should not call getRange when inserting a new record", () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecord(SHEET_NAMES.TASKS, { id: "new-id" });

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it("should append row with record data in correct column order", () => {
    const sheetMock = setupSheet([TASK_HEADERS]);

    upsertRecord(SHEET_NAMES.TASKS, {
      id: "new-id",
      name: "My task",
    });

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[TASK_COL.id]).toBe("new-id");
    expect(appendedRow[TASK_COL.name]).toBe("My task");
  });

  it("should call getRange and setValues when id already exists", () => {
    const sheetMock = setupSheetWithTasks("task-1");

    upsertRecord(SHEET_NAMES.TASKS, { id: "task-1", title: "Updated" });

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it("should not call appendRow when updating an existing record", () => {
    const sheetMock = setupSheetWithTasks("task-1");

    upsertRecord(SHEET_NAMES.TASKS, { id: "task-1" });

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it("should update the correct 1-based row index", () => {
    // Header at index 0, record at index 1 → sheet row 2
    const sheetMock = setupSheetWithTasks("task-1");

    upsertRecord(SHEET_NAMES.TASKS, { id: "task-1" });

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_TASK_COLS);
  });

  it("should update the correct row when target is the third data row", () => {
    const sheetMock = setupSheetWithTasks("task-1", "task-2", "task-3");

    upsertRecord(SHEET_NAMES.TASKS, { id: "task-3" });

    expect(sheetMock.getRange).toHaveBeenCalledWith(4, 1, 1, NUM_TASK_COLS);
  });

  it("should write updated record data when updating existing row", () => {
    const sheetMock = setupSheet([
      TASK_HEADERS,
      makeTaskRow("task-1", { name: "Old name" }),
    ]);

    upsertRecord(SHEET_NAMES.TASKS, { id: "task-1", name: "New name" });

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[TASK_COL.name]).toBe("New name");
  });

  it("should call getSheet with the given sheet name", () => {
    setupSheet([TASK_HEADERS]);

    upsertRecord(SHEET_NAMES.TASKS, { id: "new-id" });

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});
