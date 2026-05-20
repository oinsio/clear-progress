import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIONS, ERROR_MESSAGES } from "./helpers/constants";
import { ERROR_CODES } from "./helpers/response";

vi.mock("./actions/ping", () => ({ ping: vi.fn() }));
vi.mock("./actions/init", () => ({ init: vi.fn() }));
vi.mock("./actions/pull", () => ({ pull: vi.fn() }));
vi.mock("./actions/push", () => ({ push: vi.fn() }));
vi.mock("./actions/purge", () => ({ purge: vi.fn() }));
vi.mock("./actions/upload-cover", () => ({ uploadCover: vi.fn() }));
vi.mock("./actions/upload-covers", () => ({ uploadCovers: vi.fn() }));
vi.mock("./actions/delete-cover", () => ({ deleteCover: vi.fn() }));
vi.mock("./actions/get-cover", () => ({ getCover: vi.fn() }));
vi.mock("./helpers/auth", () => ({ verifyToken: vi.fn() }));

import { deleteCover } from "./actions/delete-cover";
import { getCover } from "./actions/get-cover";
import { init } from "./actions/init";
import { pull } from "./actions/pull";
import { purge } from "./actions/purge";
import { push } from "./actions/push";
import { uploadCover } from "./actions/upload-cover";
import { uploadCovers } from "./actions/upload-covers";
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

  it("should call uploadCover() with payload fields (excluding action and access_token)", () => {
    const coverPayload = {
      goal_id: "goal-1",
      filename: "cover.jpg",
      mime_type: "image/jpeg",
      data: "base64",
    };

    globals.doPost?.(
      makeAuthenticatedPostEvent({
        action: ACTIONS.UPLOAD_COVER,
        ...coverPayload,
      }),
    );

    expect(uploadCover).toHaveBeenCalledWith(coverPayload);
  });

  it("should call deleteCover() with payload fields (excluding action and access_token)", () => {
    globals.doPost?.(
      makeAuthenticatedPostEvent({
        action: ACTIONS.DELETE_COVER,
        file_id: "file-abc",
      }),
    );

    expect(deleteCover).toHaveBeenCalledWith({ file_id: "file-abc" });
  });

  it("should call uploadCovers() with payload fields (excluding action and access_token)", () => {
    const coversPayload = {
      covers: [
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
        action: ACTIONS.UPLOAD_COVERS,
        ...coversPayload,
      }),
    );

    expect(uploadCovers).toHaveBeenCalledWith(coversPayload);
  });

  it("should return the result of uploadCovers()", () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(uploadCovers).mockReturnValue(mockOutput as never);

    const result = globals.doPost?.(
      makeAuthenticatedPostEvent({ action: ACTIONS.UPLOAD_COVERS }),
    );

    expect(result).toBe(mockOutput);
  });

  it("should call getCover() with payload fields (excluding action and access_token)", () => {
    globals.doPost?.(
      makeAuthenticatedPostEvent({
        action: ACTIONS.GET_COVER,
        file_ids: ["file-1"],
      }),
    );

    expect(getCover).toHaveBeenCalledWith({ file_ids: ["file-1"] });
  });

  it("should return the result of getCover()", () => {
    const mockOutput = { setMimeType: vi.fn().mockReturnThis() };
    vi.mocked(getCover).mockReturnValue(mockOutput as never);

    const result = globals.doPost?.(
      makeAuthenticatedPostEvent({ action: ACTIONS.GET_COVER }),
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
