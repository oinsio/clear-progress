import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  expectInvalidPayloadError,
  expectSuccessResponse,
} from "../../../tests/server/helpers";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/ideas.sheet");
vi.mock("../sheets/attachments.sheet");
vi.mock("../sheets/meta.sheet");

import { purge } from "./purge";
import { resetAllMocks } from "./purge-test-utils";

describe("purge — validation", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it("should return error when confirm is missing", () => {
    purge({});
    expectInvalidPayloadError();
  });

  it("should return error when confirm is false", () => {
    purge({ confirm: false });
    expectInvalidPayloadError();
  });

  it("should return error when payload is null", () => {
    purge(null as never);
    expectInvalidPayloadError();
  });

  it("should return error when payload is undefined", () => {
    purge(undefined as never);
    expectInvalidPayloadError();
  });

  it.each([
    1,
    "true",
    {},
    [],
    null,
  ])("should return error when confirm is %s (non-boolean or null)", (value) => {
    purge({ confirm: value });
    expectInvalidPayloadError();
  });

  it("should return zeros when no soft-deleted records exist", () => {
    purge({ confirm: true });
    const response = expectSuccessResponse();
    expect(response.purged).toEqual({
      tasks: 0,
      goals: 0,
      contexts: 0,
      categories: 0,
      checklist_items: 0,
      ideas: 0,
      attachments: 0,
    });
  });
});
