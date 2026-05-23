import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSheet } from "./client";
import { getTasksByRevision } from "./tasks.sheet";
import {
  makeSheetMock,
  makeTaskRow,
  TASK_HEADERS,
} from "./tasks.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getTasksByRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return tasks with revision strictly greater than minRevision", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1", revision: 3 }),
      makeTaskRow({ id: "task-2", revision: 5 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const tasks = getTasksByRevision(2);
    expect(tasks.map((t) => t.id)).toEqual(["task-1", "task-2"]);
  });

  it("should not return tasks with revision equal to minRevision", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1", revision: 5 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByRevision(5)).toHaveLength(0);
  });

  it("should not return tasks with revision less than minRevision", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1", revision: 3 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByRevision(5)).toHaveLength(0);
  });

  it("should return all tasks when minRevision is 0", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1", revision: 1 }),
      makeTaskRow({ id: "task-2", revision: 2 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByRevision(0)).toHaveLength(2);
  });

  it("should return legacy tasks with revision=0 when sinceRevision is 0", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-legacy", revision: 0 }),
      makeTaskRow({ id: "task-revised", revision: 3 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByRevision(0)).toHaveLength(2);
  });

  it("should return legacy tasks with revision=0 even when sinceRevision is greater than 0", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-legacy", revision: 0 }),
      makeTaskRow({ id: "task-old", revision: 2 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const tasks = getTasksByRevision(5);
    expect(tasks.map((t) => t.id)).toEqual(["task-legacy"]);
  });

  it("should return empty array when no tasks match", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ revision: 1 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getTasksByRevision(10)).toEqual([]);
  });
});
