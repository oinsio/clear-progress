import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIONS,
  AUTH_FAILURE_REASONS,
  ERROR_MESSAGES,
} from "./helpers/constants";
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

import { init } from "./actions/init";
import { verifyToken } from "./helpers/auth";

import "./main";
import {
  globals,
  makeAuthenticatedPostEvent,
  makePostEvent,
  OWNER_EMAIL,
  parseResponse,
  VALID_TOKEN,
} from "./main-test-utils";

describe("doPost — authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyToken).mockReturnValue({
      ok: true,
      email: OWNER_EMAIL,
    } as never);
  });

  it("should return UNAUTHORIZED when access_token is missing", () => {
    globals.doPost?.(makePostEvent({ action: ACTIONS.INIT }));

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("should include TOKEN_REQUIRED message when access_token is missing", () => {
    globals.doPost?.(makePostEvent({ action: ACTIONS.INIT }));

    expect(parseResponse().message).toBe(ERROR_MESSAGES.TOKEN_REQUIRED);
  });

  it("should return UNAUTHORIZED when access_token is not a string", () => {
    globals.doPost?.(
      makePostEvent({ action: ACTIONS.INIT, access_token: 123 }),
    );

    expect(parseResponse().error).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("should include TOKEN_REQUIRED message when access_token is not a string", () => {
    globals.doPost?.(
      makePostEvent({ action: ACTIONS.INIT, access_token: 123 }),
    );

    expect(parseResponse().message).toBe(ERROR_MESSAGES.TOKEN_REQUIRED);
  });

  it("should return UNAUTHORIZED when verifyToken returns NETWORK_ERROR", () => {
    vi.mocked(verifyToken).mockReturnValue({
      ok: false,
      reason: AUTH_FAILURE_REASONS.NETWORK_ERROR,
    } as never);
    globals.doPost?.(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

    expect(parseResponse().error).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it.each([
    [AUTH_FAILURE_REASONS.NETWORK_ERROR, ERROR_MESSAGES.AUTH_NETWORK_ERROR],
    [
      AUTH_FAILURE_REASONS.INVALID_RESPONSE,
      ERROR_MESSAGES.AUTH_INVALID_RESPONSE,
    ],
    [
      AUTH_FAILURE_REASONS.EMAIL_NOT_VERIFIED,
      ERROR_MESSAGES.AUTH_EMAIL_NOT_VERIFIED,
    ],
    [AUTH_FAILURE_REASONS.WRONG_ACCOUNT, ERROR_MESSAGES.AUTH_WRONG_ACCOUNT],
  ])("should include correct message when verifyToken returns %s", (reason, expectedMessage) => {
    vi.mocked(verifyToken).mockReturnValue({ ok: false, reason } as never);
    globals.doPost?.(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

    expect(parseResponse().message).toBe(expectedMessage);
  });

  it("should call verifyToken with the provided access_token", () => {
    globals.doPost?.(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

    expect(verifyToken).toHaveBeenCalledWith(VALID_TOKEN);
  });

  it("should not call any action handler when unauthorized", () => {
    vi.mocked(verifyToken).mockReturnValue({
      ok: false,
      reason: AUTH_FAILURE_REASONS.WRONG_ACCOUNT,
    } as never);
    globals.doPost?.(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

    expect(init).not.toHaveBeenCalled();
  });

  it("should include auth failure details in the error message when verifyToken returns details", () => {
    vi.mocked(verifyToken).mockReturnValue({
      ok: false,
      reason: AUTH_FAILURE_REASONS.NETWORK_ERROR,
      details: "connection refused",
    } as never);
    globals.doPost?.(makeAuthenticatedPostEvent({ action: ACTIONS.INIT }));

    expect(parseResponse().message).toContain("connection refused");
  });
});
