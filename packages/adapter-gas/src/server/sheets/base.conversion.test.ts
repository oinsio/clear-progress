/// <reference lib="esnext" />
import { describe, expect, it } from "vitest";
import { colMap, SHEET_NAMES } from "../helpers/constants";
import { recordToRow, rowToNamedEntity } from "./base";
import { NUM_TASK_COLS, TASK_COL } from "./base-test-utils";

describe("recordToRow", () => {
  it("should return array with length equal to header count", () => {
    const record = { id: "task-1", title: "Test" };
    const row = recordToRow(SHEET_NAMES.TASKS, record);
    expect(row).toHaveLength(NUM_TASK_COLS);
  });

  it("should place field values at correct column indices", () => {
    const record = { id: "abc", name: "Hello" };
    const row = recordToRow(SHEET_NAMES.TASKS, record);
    expect(row[TASK_COL.id]).toBe("abc");
    expect(row[TASK_COL.name]).toBe("Hello");
  });

  it("should place undefined for fields not present in record", () => {
    const record = { id: "abc" };
    const row = recordToRow(SHEET_NAMES.TASKS, record);
    expect(row[TASK_COL.name]).toBeUndefined();
  });
});

describe("rowToNamedEntity", () => {
  it("should return empty string for id when id cell is null", () => {
    const cols = colMap(SHEET_NAMES.CATEGORIES);
    const numCols = Object.keys(cols).length;
    const row = new Array(numCols).fill("");
    row[cols.id] = null;
    row[cols.name] = "Work";

    const result = rowToNamedEntity(row, cols);
    expect(result.id).toBe("");
  });
});
