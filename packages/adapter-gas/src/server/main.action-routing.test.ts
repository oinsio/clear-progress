import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIONS, ERROR_MESSAGES } from "./helpers/constants";
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

import { deleteFile } from "./actions/delete-file";
import { getFile } from "./actions/get-file";
import { init } from "./actions/init";
import { pull } from "./actions/pull";
import { purge } from "./actions/purge";
import { push } from "./actions/push";
import { uploadFile } from "./actions/upload-file";
import { uploadFiles } from "./actions/upload-files";
import { verifyToken } from "./helpers/auth";

import "./main";
import {
  globals,
  makeAuthenticatedPostEvent,
  makePostEventRaw,
  OWNER_EMAIL,
  parseResponse,
} from "./main-test-utils";

describe("doPost — action routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyToken).mockReturnValue({
      ok: true,
      email: OWNER_EMAIL,
    } as never);
  });

  it("should return INVALID_PAYLOAD when body is not valid JSON", () => {
    globals.doPost?.(makePostEventRaw("{not valid json"));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    expect(response.message).toBe(ERROR_MESSAGES.INVALID_JSON);
  });

  it("should return UNAUTHORIZED when postData is missing (no token in body)", () => {
    globals.doPost?.({} as never);

    expect(parseResponse().error).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it('should call init() for "init" action', () => {
    globals.doPost?.(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("should call pull() with since_revision from the request body", () => {
    const sinceRevision = { since_revision: 42 };

    globals.doPost?.(
      makeAuthenticatedPostEvent({ action: ACTIONS.PULL, ...sinceRevision }),
    );

    expect(pull).toHaveBeenCalledWith(sinceRevision);
  });

  it("should call push() with changes from the request body", () => {
    const changes = { tasks: [{ id: "task-1" }] };

    globals.doPost?.(
      makeAuthenticatedPostEvent({ action: ACTIONS.PUSH, changes }),
    );

    expect(push).toHaveBeenCalledWith({ changes });
  });

  it("should call uploadFile() with payload fields (excluding action and access_token)", () => {
    const filePayload = {
      goal_id: "goal-1",
      filename: "cover.jpg",
      mime_type: "image/jpeg",
      data: "base64",
    };

    globals.doPost?.(
      makeAuthenticatedPostEvent({
        action: ACTIONS.UPLOAD_FILE,
        ...filePayload,
      }),
    );

    expect(uploadFile).toHaveBeenCalledWith(filePayload);
  });

  it("should call deleteFile() with payload fields (excluding action and access_token)", () => {
    globals.doPost?.(
      makeAuthenticatedPostEvent({
        action: ACTIONS.DELETE_FILE,
        hash: "hash-abc",
      }),
    );

    expect(deleteFile).toHaveBeenCalledWith({ hash: "hash-abc" });
  });

  it("should call uploadFiles() with payload fields (excluding action and access_token)", () => {
    const filesPayload = {
      files: [
        {
          goal_id: "g-1",
          filename: "a.jpg",
          mime_type: "image/jpeg",
          data: "b64",
        },
      ],
    };

    globals.doPost?.(
      makeAuthenticatedPostEvent({
        action: ACTIONS.UPLOAD_FILES,
        ...filesPayload,
      }),
    );

    expect(uploadFiles).toHaveBeenCalledWith(filesPayload);
  });

  it("should return the result of uploadFiles()", () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(uploadFiles).mockReturnValue(mockOutput as never);

    const result = globals.doPost?.(
      makeAuthenticatedPostEvent({ action: ACTIONS.UPLOAD_FILES }),
    );

    expect(result).toBe(mockOutput);
  });

  it("should call getFile() with payload fields (excluding action and access_token)", () => {
    globals.doPost?.(
      makeAuthenticatedPostEvent({
        action: ACTIONS.GET_FILE,
        hashes: ["hash-1"],
      }),
    );

    expect(getFile).toHaveBeenCalledWith({ hashes: ["hash-1"] });
  });

  it("should return the result of getFile()", () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(getFile).mockReturnValue(mockOutput as never);

    const result = globals.doPost?.(
      makeAuthenticatedPostEvent({ action: ACTIONS.GET_FILE }),
    );

    expect(result).toBe(mockOutput);
  });

  it("should call purge() with payload fields (excluding action and access_token)", () => {
    globals.doPost?.(
      makeAuthenticatedPostEvent({ action: ACTIONS.PURGE, confirm: true }),
    );

    expect(purge).toHaveBeenCalledWith({ confirm: true });
  });

  it("should return the result from the matched action", () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(init).mockReturnValue(mockOutput as never);

    const result = globals.doPost?.(
      makeAuthenticatedPostEvent({ action: ACTIONS.INIT }),
    );

    expect(result).toBe(mockOutput);
  });

  it("should return INVALID_ACTION error for unknown action", () => {
    globals.doPost?.(makeAuthenticatedPostEvent({ action: "unknown_action" }));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_ACTION);
  });

  it("should include the unknown action name in the error message", () => {
    globals.doPost?.(makeAuthenticatedPostEvent({ action: "bad_action" }));

    expect(parseResponse().message).toContain("bad_action");
  });

  it("should return INVALID_ACTION when no action field is present", () => {
    globals.doPost?.(makeAuthenticatedPostEvent({}));

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_ACTION);
  });
});
