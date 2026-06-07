import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIONS } from "./helpers/constants";
import { ERROR_CODES } from "./helpers/response";

vi.mock("./actions/ping", () => ({ ping: vi.fn() }));
vi.mock("./actions/init", () => ({ init: vi.fn() }));
vi.mock("./actions/pull", () => ({ pull: vi.fn() }));
vi.mock("./actions/push", () => ({ push: vi.fn() }));
vi.mock("./actions/purge", () => ({ purge: vi.fn() }));
vi.mock("./actions/upload-file", () => ({ uploadFile: vi.fn() }));
vi.mock("./actions/upload-files", () => ({ uploadFiles: vi.fn() }));
vi.mock("./actions/delete-file", () => ({ deleteFile: vi.fn() }));
vi.mock("./actions/get-file", () => ({ getFile: vi.fn() }));
vi.mock("./helpers/auth", () => ({ verifyToken: vi.fn() }));

import { ping } from "./actions/ping";

import "./main";
import { globals, makeGetEvent, parseResponse } from "./main-test-utils";

describe("doGet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call ping() when action is "ping"', () => {
    globals.doGet?.(makeGetEvent({ action: ACTIONS.PING }));
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it("should return the result of ping()", () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(ping).mockReturnValue(mockOutput as never);

    const result = globals.doGet?.(makeGetEvent({ action: ACTIONS.PING }));

    expect(result).toBe(mockOutput);
  });

  it("should return INVALID_ACTION error for unknown action", () => {
    globals.doGet?.(makeGetEvent({ action: "unknown_action" }));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_ACTION);
  });

  it("should include the unknown action name in the error message", () => {
    globals.doGet?.(makeGetEvent({ action: "bad_action" }));

    expect(parseResponse().message).toContain("bad_action");
  });

  it("should return INVALID_ACTION when no action parameter is provided", () => {
    globals.doGet?.(makeGetEvent());

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_ACTION);
  });

  it("should return INVALID_ACTION when doGet event has no parameter property", () => {
    globals.doGet?.({} as never);

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_ACTION);
  });
});
