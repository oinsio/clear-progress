import { describe, expect, it, vi } from "vitest";
import { pull } from "./pull";
import {
  createMockEntityWithRevision,
  expectPullResponseStructure,
  expectSuccessResponse,
  expectValidServerTime,
  getAllSettings,
  getCategoriesByRevision,
  getChecklistItemsByRevision,
  getContextsByRevision,
  getGoalsByRevision,
  getIdeasByRevision,
  getTasksByRevision,
  parseResponse,
  readNextRevision,
  setupPullTests,
} from "./pull-test-utils";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/ideas.sheet");
vi.mock("../sheets/settings.sheet");
vi.mock("../sheets/meta.sheet");

describe("pull", () => {
  setupPullTests();

  it("should return ok: true on success", () => {
    pull({ since_revision: 0 });
    expectSuccessResponse();
  });

  it("should return data with all six entity arrays", () => {
    pull({ since_revision: 0 });
    expectPullResponseStructure();
  });

  it("should return settings array in response", () => {
    pull({ since_revision: 0 });
    expect(parseResponse()).toHaveProperty("settings");
  });

  it("should return server_time as ISO string", () => {
    pull({ since_revision: 0 });
    expectValidServerTime();
  });

  it.each([
    { fn: getTasksByRevision, name: "getTasksByRevision", revision: 42 },
    { fn: getGoalsByRevision, name: "getGoalsByRevision", revision: 10 },
    { fn: getContextsByRevision, name: "getContextsByRevision", revision: 5 },
    {
      fn: getCategoriesByRevision,
      name: "getCategoriesByRevision",
      revision: 3,
    },
    {
      fn: getChecklistItemsByRevision,
      name: "getChecklistItemsByRevision",
      revision: 20,
    },
    { fn: getIdeasByRevision, name: "getIdeasByRevision", revision: 15 },
  ])("should pass since_revision to $name", ({ fn, revision }) => {
    pull({ since_revision: revision });
    expect(fn).toHaveBeenCalledWith(revision);
  });

  it("should use 0 as default when since_revision is undefined", () => {
    pull({} as never);
    expect(getTasksByRevision).toHaveBeenCalledWith(0);
  });

  it.each([
    { nextRevision: 8, expected: 7, description: "next_revision minus 1" },
    {
      nextRevision: 1,
      expected: 0,
      description: "0 when next_revision is 1 (nothing pushed yet)",
    },
  ])("should return current_revision as $description", ({
    nextRevision,
    expected,
  }) => {
    vi.mocked(readNextRevision).mockReturnValue(nextRevision);
    pull({ since_revision: 0 });
    expect(parseResponse().current_revision).toBe(expected);
  });

  it("should return entity records returned by sheet functions", () => {
    const mockTask = createMockEntityWithRevision("task-1", 5);
    vi.mocked(getTasksByRevision).mockReturnValue([mockTask]);

    pull({ since_revision: 0 });

    const response = parseResponse();
    expect(response.tasks).toEqual([mockTask]);
  });

  it("should return settings returned by getAllSettings", () => {
    const mockSettings = [
      {
        key: "default_box",
        value: "inbox",
        updated_at: "2025-01-01T00:00:00.000Z",
      },
    ];
    vi.mocked(getAllSettings).mockReturnValue(mockSettings);

    pull({ since_revision: 0 });

    expect(parseResponse().settings).toEqual(mockSettings);
  });
});
