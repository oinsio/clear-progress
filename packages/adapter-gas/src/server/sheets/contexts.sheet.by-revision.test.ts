import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSheet } from "./client";
import { getContextsByRevision } from "./contexts.sheet";
import {
  CTX_HEADERS,
  makeContextRow,
  makeSheetMock,
} from "./contexts.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getContextsByRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return contexts with revision strictly greater than minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ id: "ctx-1", revision: 3 }),
        makeContextRow({ id: "ctx-2", revision: 5 }),
      ]) as never,
    );

    const contexts = getContextsByRevision(2);
    expect(contexts.map((c) => c.id)).toEqual(["ctx-1", "ctx-2"]);
  });

  it("should not return contexts with revision equal to minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CTX_HEADERS, makeContextRow({ revision: 5 })]) as never,
    );

    expect(getContextsByRevision(5)).toHaveLength(0);
  });

  it("should not return contexts with revision less than minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CTX_HEADERS, makeContextRow({ revision: 3 })]) as never,
    );

    expect(getContextsByRevision(5)).toHaveLength(0);
  });

  it("should return all contexts when minRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ id: "ctx-1", revision: 1 }),
        makeContextRow({ id: "ctx-2", revision: 2 }),
      ]) as never,
    );

    expect(getContextsByRevision(0)).toHaveLength(2);
  });

  it("should return legacy contexts with revision=0 when sinceRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ id: "ctx-legacy", revision: 0 }),
        makeContextRow({ id: "ctx-revised", revision: 3 }),
      ]) as never,
    );

    expect(getContextsByRevision(0)).toHaveLength(2);
  });

  it("should return legacy contexts with revision=0 even when sinceRevision is greater than 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CTX_HEADERS,
        makeContextRow({ id: "ctx-legacy", revision: 0 }),
        makeContextRow({ id: "ctx-old", revision: 2 }),
      ]) as never,
    );

    const contexts = getContextsByRevision(5);
    expect(contexts.map((c) => c.id)).toEqual(["ctx-legacy"]);
  });

  it("should return empty array when no contexts match", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CTX_HEADERS, makeContextRow({ revision: 1 })]) as never,
    );

    expect(getContextsByRevision(10)).toEqual([]);
  });
});
