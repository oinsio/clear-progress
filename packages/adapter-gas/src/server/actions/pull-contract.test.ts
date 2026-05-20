import { describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "../helpers/response";
import { pull } from "./pull";
import {
  expectErrorResponse,
  getAllSettings,
  getContextsByRevision,
  getGoalsByRevision,
  getTasksByRevision,
  makeGoal,
  makeTask,
  parseResponse,
  readNextRevision,
  readPurgeRevision,
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

describe("pull — error handling", () => {
  setupPullTests();

  it("should return NOT_INITIALIZED error when sheet throws with NOT_INITIALIZED message", () => {
    vi.mocked(getTasksByRevision).mockImplementation(() => {
      throw new Error(ERROR_CODES.NOT_INITIALIZED);
    });

    pull({ since_revision: 0 });
    expectErrorResponse(ERROR_CODES.NOT_INITIALIZED);
  });

  it("should return INTERNAL_ERROR when sheet throws an unexpected error", () => {
    vi.mocked(getGoalsByRevision).mockImplementation(() => {
      throw new Error("Something went wrong");
    });

    pull({ since_revision: 0 });
    expectErrorResponse(ERROR_CODES.INTERNAL_ERROR);
  });

  it("should include the original error message in INTERNAL_ERROR response", () => {
    const originalMessage = "Unexpected sheet error";
    vi.mocked(getContextsByRevision).mockImplementation(() => {
      throw new Error(originalMessage);
    });

    pull({ since_revision: 0 });

    expect(parseResponse().message).toBe(originalMessage);
  });
});

describe("pull — response structure matches PullResponse contract", () => {
  setupPullTests();

  it("should return complete response matching PullResponse shape", () => {
    const mockTask = makeTask({ revision: 5 });
    const mockGoal = makeGoal({ revision: 5 });
    const mockSetting = {
      key: "default_box",
      value: "inbox",
      updated_at: "2025-01-01T00:00:00.000Z",
    };
    vi.mocked(getTasksByRevision).mockReturnValue([mockTask]);
    vi.mocked(getGoalsByRevision).mockReturnValue([mockGoal]);
    vi.mocked(getAllSettings).mockReturnValue([mockSetting]);
    vi.mocked(readNextRevision).mockReturnValue(6);
    vi.mocked(readPurgeRevision).mockReturnValue(2);

    pull({ since_revision: 0 });

    const response = parseResponse();
    expect(response).toStrictEqual({
      ok: true,
      tasks: [mockTask],
      goals: [mockGoal],
      contexts: [],
      categories: [],
      checklist_items: [],
      ideas: [],
      settings: [mockSetting],
      current_revision: 5,
      purge_revision: 2,
      server_time: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });
  });

  it("should return complete empty response matching PullResponse shape", () => {
    vi.mocked(readNextRevision).mockReturnValue(1);
    vi.mocked(readPurgeRevision).mockReturnValue(0);

    pull({ since_revision: 0 });

    const response = parseResponse();
    expect(response).toStrictEqual({
      ok: true,
      tasks: [],
      goals: [],
      contexts: [],
      categories: [],
      checklist_items: [],
      ideas: [],
      settings: [],
      current_revision: 0,
      purge_revision: 0,
      server_time: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });
  });
});
