import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_HEADERS, SHEET_NAMES } from "../helpers/constants";
import type { Idea } from "../types";
import { getSheet } from "./client";
import {
  deleteIdeasByIds,
  getAllIdeas,
  getIdeasByRevision,
  upsertIdeas,
} from "./ideas.sheet";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

const IDEA_HEADERS = SHEET_HEADERS[SHEET_NAMES.IDEAS];

function makeIdeaRow(
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

function makeSheetMock(rows: unknown[][] = []) {
  const setValuesMock = vi.fn();
  return {
    getDataRange: vi
      .fn()
      .mockReturnValue({ getValues: vi.fn().mockReturnValue(rows) }),
    getRange: vi.fn().mockReturnValue({ setValues: setValuesMock }),
    appendRow: vi.fn(),
    deleteRow: vi.fn(),
    _setValues: setValuesMock,
  };
}

describe("getAllIdeas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when sheet has only a header row", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([IDEA_HEADERS]) as never);

    expect(getAllIdeas()).toEqual([]);
  });

  it("should return empty array when sheet has no rows", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllIdeas()).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = IDEA_HEADERS.map(() => "");
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, emptyRow]) as never,
    );

    expect(getAllIdeas()).toEqual([]);
  });

  it("should return one idea when sheet has one data row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow()]) as never,
    );

    expect(getAllIdeas()).toHaveLength(1);
  });

  it("should return multiple ideas", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-1" }),
        makeIdeaRow({ id: "idea-2" }),
        makeIdeaRow({ id: "idea-3" }),
      ]) as never,
    );

    expect(getAllIdeas()).toHaveLength(3);
  });

  it("should correctly map string fields from row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({
          id: "idea-abc",
          name: "Startup Idea",
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-06-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.id).toBe("idea-abc");
    expect(idea.name).toBe("Startup Idea");
    expect(idea.created_at).toBe("2025-01-01T00:00:00.000Z");
    expect(idea.updated_at).toBe("2025-06-01T00:00:00.000Z");
  });

  it("should map numeric fields sort_order and revision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ sort_order: 2, revision: 5 }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.sort_order).toBe(2);
    expect(idea.revision).toBe(5);
  });

  it("should correctly map description field", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ description: "Build a SaaS product" }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.description).toBe("Build a SaaS product");
  });

  it("should coerce null description to empty string", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ description: null }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.description).toBe("");
  });

  it("should coerce undefined description to empty string", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ description: undefined }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.description).toBe("");
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ is_deleted: "TRUE" }),
      ]) as never,
    );

    expect(getAllIdeas()[0].is_deleted).toBe(true);
  });

  it("should coerce boolean true for is_deleted", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow({ is_deleted: true })]) as never,
    );

    expect(getAllIdeas()[0].is_deleted).toBe(true);
  });

  it("should coerce false for is_deleted when value is not TRUE", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ is_deleted: "false" }),
      ]) as never,
    );

    expect(getAllIdeas()[0].is_deleted).toBe(false);
  });

  it("should call getSheet with Ideas sheet name", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllIdeas();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.IDEAS);
  });

  it("should coerce null row values to empty string for string fields", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({
          name: null,
          description: null,
          created_at: null,
          updated_at: null,
        }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.name).toBe("");
    expect(idea.description).toBe("");
    expect(idea.created_at).toBe("");
    expect(idea.updated_at).toBe("");
  });
});

describe("getIdeasByRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return ideas with revision strictly greater than sinceRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-1", revision: 3 }),
        makeIdeaRow({ id: "idea-2", revision: 5 }),
      ]) as never,
    );

    const ideas = getIdeasByRevision(2);
    expect(ideas.map((i) => i.id)).toEqual(["idea-1", "idea-2"]);
  });

  it("should not return ideas with revision equal to sinceRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow({ revision: 5 })]) as never,
    );

    expect(getIdeasByRevision(5)).toHaveLength(0);
  });

  it("should not return ideas with revision less than sinceRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow({ revision: 3 })]) as never,
    );

    expect(getIdeasByRevision(5)).toHaveLength(0);
  });

  it("should return all ideas when sinceRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-1", revision: 1 }),
        makeIdeaRow({ id: "idea-2", revision: 2 }),
      ]) as never,
    );

    expect(getIdeasByRevision(0)).toHaveLength(2);
  });

  it("should return legacy ideas with revision=0 when sinceRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-legacy", revision: 0 }),
        makeIdeaRow({ id: "idea-revised", revision: 3 }),
      ]) as never,
    );

    expect(getIdeasByRevision(0)).toHaveLength(2);
  });

  it("should return legacy ideas with revision=0 even when sinceRevision is greater than 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-legacy", revision: 0 }),
        makeIdeaRow({ id: "idea-old", revision: 2 }),
      ]) as never,
    );

    const ideas = getIdeasByRevision(5);
    expect(ideas.map((i) => i.id)).toEqual(["idea-legacy"]);
  });

  it("should return empty array when no ideas match", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow({ revision: 1 })]) as never,
    );

    expect(getIdeasByRevision(10)).toEqual([]);
  });
});

describe("deleteIdeasByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when ids array is empty", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteIdeasByIds([])).toBe(0);
  });

  it("should return 0 when no rows match the given ids", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteIdeasByIds(["idea-nonexistent"])).toBe(0);
  });

  it("should return count of deleted rows", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
      makeIdeaRow({ id: "idea-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteIdeasByIds(["idea-1", "idea-2"])).toBe(2);
  });

  it("should call deleteRow for each matched id", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
      makeIdeaRow({ id: "idea-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteIdeasByIds(["idea-1", "idea-2"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it("should not call deleteRow for rows not in the ids list", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-keep" }),
      makeIdeaRow({ id: "idea-delete" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteIdeasByIds(["idea-delete"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it("should delete rows in reverse order to preserve row indices", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }), // row 2
      makeIdeaRow({ id: "idea-2" }), // row 3
      makeIdeaRow({ id: "idea-3" }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteIdeasByIds(["idea-1", "idea-2", "idea-3"]);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it("should delete the correct 1-based row index", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteIdeasByIds(["idea-1"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});

describe("upsertIdeas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when adding a new idea", () => {
    const sheetMock = makeSheetMock([IDEA_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const newIdea: Idea = {
      id: "idea-new",
      name: "New Idea",
      description: "A brand new idea",
      sort_order: 0,
      is_deleted: false,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      revision: 0,
    };
    upsertIdeas([newIdea]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });
});
