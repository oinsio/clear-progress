/// <reference lib="esnext" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { deleteRecordsByIds } from "./base";
import { setupSheet, setupSheetWithTasks } from "./base-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("deleteRecordsByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when ids array is empty", () => {
    setupSheetWithTasks("task-1");

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, [])).toBe(0);
  });

  it("should return 0 when no rows match the given ids", () => {
    setupSheetWithTasks("task-1");

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, ["task-nonexistent"])).toBe(0);
  });

  it("should return count of deleted rows", () => {
    setupSheetWithTasks("task-1", "task-2");

    expect(deleteRecordsByIds(SHEET_NAMES.TASKS, ["task-1", "task-2"])).toBe(2);
  });

  it("should call deleteRow for each matched id", () => {
    const sheetMock = setupSheetWithTasks("task-1", "task-2");

    deleteRecordsByIds(SHEET_NAMES.TASKS, ["task-1", "task-2"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it("should not call deleteRow for rows not in the ids list", () => {
    const sheetMock = setupSheetWithTasks("task-keep", "task-delete");

    deleteRecordsByIds(SHEET_NAMES.TASKS, ["task-delete"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it("should delete rows in reverse order to preserve row indices", () => {
    const sheetMock = setupSheetWithTasks("task-1", "task-2", "task-3"); // rows 2, 3, 4

    deleteRecordsByIds(SHEET_NAMES.TASKS, ["task-1", "task-2", "task-3"]);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it("should delete the correct 1-based row index", () => {
    // Header at index 0, record at index 1 → sheet row 2
    const sheetMock = setupSheetWithTasks("task-1");

    deleteRecordsByIds(SHEET_NAMES.TASKS, ["task-1"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });

  it("should call getSheet with the given sheet name", () => {
    setupSheet([]);

    deleteRecordsByIds(SHEET_NAMES.TASKS, []);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});
