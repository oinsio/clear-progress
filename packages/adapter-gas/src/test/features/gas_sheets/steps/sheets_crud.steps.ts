// implements FR10 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import {
  SHEET_HEADERS,
  SHEET_NAMES,
} from "../../../../server/helpers/constants";
import type { SheetMock } from "../../../../server/sheets/make-sheet-mock";
import { makeSheetMock } from "../../../../server/sheets/make-sheet-mock";

vi.mock("../../../../server/sheets/client", () => ({
  getSheet: vi.fn(),
  getSpreadsheet: vi.fn(),
}));

import {
  deleteRecordsByIds,
  getAllRecords,
  upsertRecord,
  upsertRecords,
} from "../../../../server/sheets/base";
import { getSheet } from "../../../../server/sheets/client";

const feature = await loadFeature("../sheets_crud.feature");

const CONTEXT_HEADERS = SHEET_HEADERS[SHEET_NAMES.CONTEXTS];
const NUM_CONTEXT_COLS = CONTEXT_HEADERS.length;

function makeContextRow(id: string): unknown[] {
  const row = Array(NUM_CONTEXT_COLS).fill("");
  row[0] = id;
  return row;
}

function setupMockedSheet(rows: unknown[][]): SheetMock {
  const sheetMock = makeSheetMock(rows);
  vi.mocked(getSheet).mockReturnValue(sheetMock as never);
  return sheetMock;
}

type FeatureContext = Record<string, never>;

let currentSheetMock: SheetMock;
let records: unknown[];
let deleteCount: number;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
    });

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario("getAllRecords returns mapped rows", ({ Given, When, Then }) => {
      Given("sheet has header row and two data rows", (_ctx: TestContext) => {
        currentSheetMock = setupMockedSheet([
          CONTEXT_HEADERS,
          makeContextRow("id-1"),
          makeContextRow("id-2"),
        ]);
      });
      When("reading all records with a row mapper", (_ctx: TestContext) => {
        records = getAllRecords(SHEET_NAMES.CONTEXTS, (row) => ({
          id: String(row[0]),
        }));
      });
      Then("two mapped records are returned", (_ctx: TestContext) => {
        expect(records).toHaveLength(2);
      });
    });

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario(
      "getAllRecords returns empty array for empty sheet",
      ({ Given, When, Then }) => {
        Given("sheet has only header row", (_ctx: TestContext) => {
          currentSheetMock = setupMockedSheet([CONTEXT_HEADERS]);
        });
        When("reading all records with a row mapper", (_ctx: TestContext) => {
          records = getAllRecords(SHEET_NAMES.CONTEXTS, (row) => ({
            id: String(row[0]),
          }));
        });
        Then("no records are returned", (_ctx: TestContext) => {
          expect(records).toHaveLength(0);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario(
      "getAllRecords skips rows with empty id",
      ({ Given, When, Then }) => {
        Given(
          "sheet has header row and one row with empty id",
          (_ctx: TestContext) => {
            currentSheetMock = setupMockedSheet([
              CONTEXT_HEADERS,
              makeContextRow(""),
            ]);
          },
        );
        When("reading all records with a row mapper", (_ctx: TestContext) => {
          records = getAllRecords(SHEET_NAMES.CONTEXTS, (row) => ({
            id: String(row[0]),
          }));
        });
        Then("no records are returned", (_ctx: TestContext) => {
          expect(records).toHaveLength(0);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario("upsertRecord inserts new record", ({ Given, When, Then }) => {
      Given("sheet has only header row", (_ctx: TestContext) => {
        currentSheetMock = setupMockedSheet([CONTEXT_HEADERS]);
      });
      When("upserting a new record", (_ctx: TestContext) => {
        upsertRecord(SHEET_NAMES.CONTEXTS, {
          id: "new-1",
          name: "Work",
          sort_order: 0,
          is_deleted: false,
          created_at: "",
          updated_at: "",
          revision: 1,
        });
      });
      Then("appendRow is called with the record data", (_ctx: TestContext) => {
        expect(currentSheetMock.appendRow).toHaveBeenCalledTimes(1);
      });
    });

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario(
      "upsertRecord updates existing record",
      ({ Given, When, Then }) => {
        Given(
          'sheet has header row and existing record with id "abc-123"',
          (_ctx: TestContext) => {
            currentSheetMock = setupMockedSheet([
              CONTEXT_HEADERS,
              makeContextRow("abc-123"),
            ]);
          },
        );
        When('upserting record with id "abc-123"', (_ctx: TestContext) => {
          upsertRecord(SHEET_NAMES.CONTEXTS, {
            id: "abc-123",
            name: "Updated",
            sort_order: 1,
            is_deleted: false,
            created_at: "",
            updated_at: "",
            revision: 2,
          });
        });
        Then(
          "setValues is called to update the existing row",
          (_ctx: TestContext) => {
            expect(currentSheetMock.getRange).toHaveBeenCalled();
            expect(currentSheetMock._setValues).toHaveBeenCalledTimes(1);
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario(
      "upsertRecords handles batch with mix of inserts and updates",
      ({ Given, When, Then, And }) => {
        Given(
          'sheet has header row and existing record with id "existing-1"',
          (_ctx: TestContext) => {
            currentSheetMock = setupMockedSheet([
              CONTEXT_HEADERS,
              makeContextRow("existing-1"),
            ]);
          },
        );
        When(
          'upserting batch with "existing-1" and "new-1"',
          (_ctx: TestContext) => {
            upsertRecords(SHEET_NAMES.CONTEXTS, [
              {
                id: "existing-1",
                name: "Updated",
                sort_order: 0,
                is_deleted: false,
                created_at: "",
                updated_at: "",
                revision: 2,
              },
              {
                id: "new-1",
                name: "New",
                sort_order: 1,
                is_deleted: false,
                created_at: "",
                updated_at: "",
                revision: 1,
              },
            ]);
          },
        );
        Then(
          "setValues is called for the existing record",
          (_ctx: TestContext) => {
            expect(currentSheetMock._setValues).toHaveBeenCalledTimes(1);
          },
        );
        And("appendRow is called for the new record", (_ctx: TestContext) => {
          expect(currentSheetMock.appendRow).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario(
      "upsertRecords with empty array does nothing",
      ({ When, Then }) => {
        When("upserting an empty batch of records", (_ctx: TestContext) => {
          upsertRecords(SHEET_NAMES.CONTEXTS, []);
        });
        Then("no sheet operations are performed", (_ctx: TestContext) => {
          expect(getSheet).not.toHaveBeenCalled();
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario(
      "deleteRecordsByIds removes existing rows",
      ({ Given, When, Then }) => {
        Given(
          'sheet has header row and records with ids "r1" and "r2"',
          (_ctx: TestContext) => {
            currentSheetMock = setupMockedSheet([
              CONTEXT_HEADERS,
              makeContextRow("r1"),
              makeContextRow("r2"),
            ]);
          },
        );
        When('deleting records by ids "r1" and "r2"', (_ctx: TestContext) => {
          deleteCount = deleteRecordsByIds(SHEET_NAMES.CONTEXTS, ["r1", "r2"]);
        });
        Then("deleteRow is called twice", (_ctx: TestContext) => {
          expect(currentSheetMock.deleteRow).toHaveBeenCalledTimes(2);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario(
      "deleteRecordsByIds returns zero for non-existing ids",
      ({ Given, When, Then }) => {
        Given(
          'sheet has header row and existing record with id "abc-123"',
          (_ctx: TestContext) => {
            currentSheetMock = setupMockedSheet([
              CONTEXT_HEADERS,
              makeContextRow("abc-123"),
            ]);
          },
        );
        When('deleting records by ids "nonexistent"', (_ctx: TestContext) => {
          deleteCount = deleteRecordsByIds(SHEET_NAMES.CONTEXTS, [
            "nonexistent",
          ]);
        });
        Then("delete count is zero", (_ctx: TestContext) => {
          expect(deleteCount).toBe(0);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR10
    f.Scenario(
      "deleteRecordsByIds removes rows from bottom to top",
      ({ Given, When, Then }) => {
        Given(
          'sheet has header row and records with ids "r1" and "r2"',
          (_ctx: TestContext) => {
            currentSheetMock = setupMockedSheet([
              CONTEXT_HEADERS,
              makeContextRow("r1"),
              makeContextRow("r2"),
            ]);
          },
        );
        When('deleting records by ids "r1" and "r2"', (_ctx: TestContext) => {
          deleteRecordsByIds(SHEET_NAMES.CONTEXTS, ["r1", "r2"]);
        });
        Then("rows are deleted in bottom-to-top order", (_ctx: TestContext) => {
          const calls = currentSheetMock.deleteRow.mock.calls;
          const firstDeletedRow = calls[0][0] as number;
          const secondDeletedRow = calls[1][0] as number;
          expect(firstDeletedRow).toBeGreaterThan(secondDeletedRow);
        });
      },
    );
  },
);
