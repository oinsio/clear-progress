import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetScriptProperties } from "../../../tests/server/setup/gas-mocks";
import { verifyToken } from "./auth";
import {
  mockTokenInfoError,
  mockTokenInfoHttpError,
  mockTokenInfoPermissionError,
} from "./auth-test-utils";
import { AUTH_FAILURE_REASONS } from "./constants";

describe("verifyToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
  });

  it("should return INVALID_RESPONSE reason when tokeninfo returns non-200 HTTP status", () => {
    mockTokenInfoHttpError(400);
    const result = verifyToken("expired-or-invalid-token");
    expect(result).toEqual({
      ok: false,
      reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE,
    });
  });

  it("should return NETWORK_ERROR reason when UrlFetchApp throws", () => {
    mockTokenInfoError();
    const result = verifyToken("any-token");
    expect(result).toMatchObject({
      ok: false,
      reason: AUTH_FAILURE_REASONS.NETWORK_ERROR,
    });
  });

  it("should include error details in result when UrlFetchApp throws", () => {
    mockTokenInfoError();
    const result = verifyToken("any-token");
    expect(result).toMatchObject({ ok: false, details: "Network error" });
  });

  it("should log the error to console when UrlFetchApp throws", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockTokenInfoError();
    verifyToken("any-token");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[verifyToken] UrlFetchApp error:",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should return GAS_PERMISSION_ERROR reason when UrlFetchApp throws a permission error", () => {
    mockTokenInfoPermissionError();
    const result = verifyToken("any-token");
    expect(result).toMatchObject({
      ok: false,
      reason: AUTH_FAILURE_REASONS.GAS_PERMISSION_ERROR,
    });
  });

  it("should include error details when GAS permission error is thrown", () => {
    mockTokenInfoPermissionError();
    const result = verifyToken("any-token");
    expect(result).toMatchObject({
      ok: false,
      details: expect.stringContaining("script.external_request"),
    });
  });

  it("should return GAS_PERMISSION_ERROR for any googleapis.com/auth scope, not just external_request", () => {
    mockTokenInfoPermissionError(
      "https://www.googleapis.com/auth/spreadsheets",
    );
    const result = verifyToken("any-token");
    expect(result).toMatchObject({
      ok: false,
      reason: AUTH_FAILURE_REASONS.GAS_PERMISSION_ERROR,
    });
  });
});
