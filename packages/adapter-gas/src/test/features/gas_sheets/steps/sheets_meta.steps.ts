// implements FR11 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import {
  META_INITIAL_PURGE_REVISION,
  META_INITIAL_REVISION,
  META_KEYS,
} from "../../../../server/helpers/constants";
import type { SheetMock } from "../../../../server/sheets/make-sheet-mock";
import { makeSheetMock } from "../../../../server/sheets/make-sheet-mock";

vi.mock("../../../../server/sheets/client", () => ({
  getSheet: vi.fn(),
  getSpreadsheet: vi.fn(),
}));

import { getSheet, getSpreadsheet } from "../../../../server/sheets/client";
import {
  initMetaSheet,
  readNextRevision,
  readPurgeRevision,
  saveNextRevision,
  savePurgeRevision,
} from "../../../../server/sheets/meta.sheet";

const feature = await loadFeature("../sheets_meta.feature");

const META_HEADERS = ["key", "value"];

function setupMetaSheet(rows: unknown[][]): SheetMock {
  const sheetMock = makeSheetMock(rows);
  vi.mocked(getSheet).mockReturnValue(sheetMock as never);
  return sheetMock;
}

type FeatureContext = Record<string, never>;

let currentSheetMock: SheetMock;
let insertedSheet: SheetMock;
let revisionValue: number;
let purgeRevisionValue: number;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
    });

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "initMetaSheet creates sheet with default values",
      ({ Given, When, Then, And }) => {
        Given("no Meta sheet exists", (_ctx: TestContext) => {
          insertedSheet = makeSheetMock([]);
          const spreadsheetMock = {
            getSheetByName: vi.fn().mockReturnValue(null),
            insertSheet: vi.fn().mockReturnValue(insertedSheet),
          };
          vi.mocked(getSpreadsheet).mockReturnValue(spreadsheetMock as never);
        });
        When("initializing the Meta sheet", (_ctx: TestContext) => {
          initMetaSheet();
        });
        Then("Meta sheet is created with header row", (_ctx: TestContext) => {
          expect(insertedSheet.appendRow).toHaveBeenCalledWith(META_HEADERS);
        });
        And(
          "next_revision row is added with default value 1",
          (_ctx: TestContext) => {
            expect(insertedSheet.appendRow).toHaveBeenCalledWith([
              META_KEYS.NEXT_REVISION,
              META_INITIAL_REVISION,
            ]);
          },
        );
        And(
          "purge_revision row is added with default value 0",
          (_ctx: TestContext) => {
            expect(insertedSheet.appendRow).toHaveBeenCalledWith([
              META_KEYS.PURGE_REVISION,
              META_INITIAL_PURGE_REVISION,
            ]);
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "initMetaSheet is idempotent when sheet exists",
      ({ Given, When, Then }) => {
        let spreadsheetMock: {
          getSheetByName: ReturnType<typeof vi.fn>;
          insertSheet: ReturnType<typeof vi.fn>;
        };

        Given("Meta sheet already exists", (_ctx: TestContext) => {
          const existingSheet = makeSheetMock([]);
          spreadsheetMock = {
            getSheetByName: vi.fn().mockReturnValue(existingSheet),
            insertSheet: vi.fn(),
          };
          vi.mocked(getSpreadsheet).mockReturnValue(spreadsheetMock as never);
        });
        When("initializing the Meta sheet", (_ctx: TestContext) => {
          initMetaSheet();
        });
        Then("no new sheet is created", (_ctx: TestContext) => {
          expect(spreadsheetMock.insertSheet).not.toHaveBeenCalled();
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "readNextRevision returns stored value",
      ({ Given, When, Then }) => {
        Given(
          "Meta sheet contains next_revision with value 5",
          (_ctx: TestContext) => {
            currentSheetMock = setupMetaSheet([
              META_HEADERS,
              [META_KEYS.NEXT_REVISION, 5],
            ]);
          },
        );
        When("reading next revision", (_ctx: TestContext) => {
          revisionValue = readNextRevision();
        });
        Then("revision value is 5", (_ctx: TestContext) => {
          expect(revisionValue).toBe(5);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "readNextRevision returns default when key is missing",
      ({ Given, When, Then }) => {
        Given("Meta sheet has no next_revision row", (_ctx: TestContext) => {
          currentSheetMock = setupMetaSheet([META_HEADERS]);
        });
        When("reading next revision", (_ctx: TestContext) => {
          revisionValue = readNextRevision();
        });
        Then("revision value is 1", (_ctx: TestContext) => {
          expect(revisionValue).toBe(META_INITIAL_REVISION);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "saveNextRevision updates existing value",
      ({ Given, When, Then }) => {
        Given(
          "Meta sheet contains next_revision with value 3",
          (_ctx: TestContext) => {
            currentSheetMock = setupMetaSheet([
              META_HEADERS,
              [META_KEYS.NEXT_REVISION, 3],
            ]);
          },
        );
        When("saving next revision with value 10", (_ctx: TestContext) => {
          saveNextRevision(10);
        });
        Then(
          "setValues is called with next_revision and 10",
          (_ctx: TestContext) => {
            expect(currentSheetMock._setValues).toHaveBeenCalledWith([
              [META_KEYS.NEXT_REVISION, 10],
            ]);
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "saveNextRevision appends when key is missing",
      ({ Given, When, Then }) => {
        Given("Meta sheet has no next_revision row", (_ctx: TestContext) => {
          currentSheetMock = setupMetaSheet([META_HEADERS]);
        });
        When("saving next revision with value 7", (_ctx: TestContext) => {
          saveNextRevision(7);
        });
        Then(
          "appendRow is called with next_revision and 7",
          (_ctx: TestContext) => {
            expect(currentSheetMock.appendRow).toHaveBeenCalledWith([
              META_KEYS.NEXT_REVISION,
              7,
            ]);
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "readPurgeRevision returns stored value",
      ({ Given, When, Then }) => {
        Given(
          "Meta sheet contains purge_revision with value 4",
          (_ctx: TestContext) => {
            currentSheetMock = setupMetaSheet([
              META_HEADERS,
              [META_KEYS.PURGE_REVISION, 4],
            ]);
          },
        );
        When("reading purge revision", (_ctx: TestContext) => {
          purgeRevisionValue = readPurgeRevision();
        });
        Then("purge revision value is 4", (_ctx: TestContext) => {
          expect(purgeRevisionValue).toBe(4);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "readPurgeRevision returns default when key is missing",
      ({ Given, When, Then }) => {
        Given("Meta sheet has no purge_revision row", (_ctx: TestContext) => {
          currentSheetMock = setupMetaSheet([META_HEADERS]);
        });
        When("reading purge revision", (_ctx: TestContext) => {
          purgeRevisionValue = readPurgeRevision();
        });
        Then("purge revision value is 0", (_ctx: TestContext) => {
          expect(purgeRevisionValue).toBe(META_INITIAL_PURGE_REVISION);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR11
    f.Scenario(
      "savePurgeRevision updates existing value",
      ({ Given, When, Then }) => {
        Given(
          "Meta sheet contains purge_revision with value 2",
          (_ctx: TestContext) => {
            currentSheetMock = setupMetaSheet([
              META_HEADERS,
              [META_KEYS.PURGE_REVISION, 2],
            ]);
          },
        );
        When("saving purge revision with value 8", (_ctx: TestContext) => {
          savePurgeRevision(8);
        });
        Then(
          "setValues is called with purge_revision and 8",
          (_ctx: TestContext) => {
            expect(currentSheetMock._setValues).toHaveBeenCalledWith([
              [META_KEYS.PURGE_REVISION, 8],
            ]);
          },
        );
      },
    );
  },
);
