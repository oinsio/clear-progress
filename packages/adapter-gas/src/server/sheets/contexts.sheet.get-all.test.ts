import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getSheet } from "./client";
import { getAllContexts } from "./contexts.sheet";
import {
  CTX_HEADERS,
  makeContextRow,
  makeSheetMock,
} from "./contexts.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getAllContexts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when sheet has only a header row", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([CTX_HEADERS]) as never);

    expect(getAllContexts()).toEqual([]);
  });

  it("should return empty array when sheet has no rows", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllContexts()).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = CTX_HEADERS.map(() => "");
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CTX_HEADERS, emptyRow]) as never,
    );

    expect(getAllContexts()).toEqual([]);
  });

  it("should return one context when sheet has one data row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CTX_HEADERS, makeContextRow()]) as never,
    );

    expect(getAllContexts()).toHaveLength(1);
  });

  it("should return multiple contexts", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ id: "ctx-1" }),
        makeContextRow({ id: "ctx-2" }),
        makeContextRow({ id: "ctx-3" }),
      ]) as never,
    );

    expect(getAllContexts()).toHaveLength(3);
  });

  it("should correctly map string fields from row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({
          id: "ctx-abc",
          name: "@Office",
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-06-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const [ctx] = getAllContexts();
    expect(ctx.id).toBe("ctx-abc");
    expect(ctx.name).toBe("@Office");
    expect(ctx.created_at).toBe("2025-01-01T00:00:00.000Z");
    expect(ctx.updated_at).toBe("2025-06-01T00:00:00.000Z");
  });

  it("should map numeric field sort_order", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CTX_HEADERS, makeContextRow({ sort_order: 2 })]) as never,
    );

    const [ctx] = getAllContexts();
    expect(ctx.sort_order).toBe(2);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ is_deleted: "TRUE" }),
      ]) as never,
    );

    expect(getAllContexts()[0].is_deleted).toBe(true);
  });

  it("should coerce boolean true for is_deleted", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ is_deleted: true }),
      ]) as never,
    );

    expect(getAllContexts()[0].is_deleted).toBe(true);
  });

  it("should coerce false for is_deleted when value is not TRUE", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ is_deleted: "false" }),
      ]) as never,
    );

    expect(getAllContexts()[0].is_deleted).toBe(false);
  });

  it("should call getSheet with Contexts sheet name", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllContexts();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.CONTEXTS);
  });

  it("should coerce null row values to empty string for string fields", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ name: null, created_at: null, updated_at: null }),
      ]) as never,
    );

    const [context] = getAllContexts();
    expect(context.name).toBe("");
    expect(context.created_at).toBe("");
    expect(context.updated_at).toBe("");
  });
});
