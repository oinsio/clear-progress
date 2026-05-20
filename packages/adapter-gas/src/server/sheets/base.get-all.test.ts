/// <reference lib="esnext" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getAllRecords } from "./base";
import { makeTaskRow, setupSheet, TASK_HEADERS } from "./base-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getAllRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when sheet has only a header row", () => {
    setupSheet([TASK_HEADERS]);

    expect(getAllRecords(SHEET_NAMES.TASKS, (row) => row)).toEqual([]);
  });

  it("should return empty array when sheet has no rows at all", () => {
    setupSheet([]);

    expect(getAllRecords(SHEET_NAMES.TASKS, (row) => row)).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = TASK_HEADERS.map(() => "");
    setupSheet([TASK_HEADERS, emptyRow]);

    expect(getAllRecords(SHEET_NAMES.TASKS, (row) => row)).toHaveLength(0);
  });

  it("should call rowMapper for each non-empty data row", () => {
    const dataRow = makeTaskRow("task-1");
    setupSheet([TASK_HEADERS, dataRow]);
    const rowMapper = vi.fn().mockReturnValue({ id: "task-1" });

    getAllRecords(SHEET_NAMES.TASKS, rowMapper);

    expect(rowMapper).toHaveBeenCalledTimes(1);
    expect(rowMapper).toHaveBeenCalledWith(dataRow);
  });

  it("should return mapped values from rowMapper", () => {
    setupSheet([TASK_HEADERS, makeTaskRow("task-1")]);
    const mappedRecord = { id: "task-1", title: "mapped" };
    const rowMapper = vi.fn().mockReturnValue(mappedRecord);

    const records = getAllRecords(SHEET_NAMES.TASKS, rowMapper);

    expect(records).toEqual([mappedRecord]);
  });

  it("should call getSheet with the given sheet name", () => {
    setupSheet([]);

    getAllRecords(SHEET_NAMES.TASKS, (row) => row);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});
