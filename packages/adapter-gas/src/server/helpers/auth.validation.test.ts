import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetScriptProperties } from "../../../tests/server/setup/gas-mocks";
import { verifyToken } from "./auth";
import {
  mockTokenInfoResponse,
  VALID_EMAIL,
  VALID_TOKEN_INFO,
} from "./auth-test-utils";
import { AUTH_FAILURE_REASONS } from "./constants";

describe("verifyToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
  });

  it('should return EMAIL_NOT_VERIFIED reason when email_verified !== "true"', () => {
    mockTokenInfoResponse({ email: VALID_EMAIL, email_verified: "false" });
    const result = verifyToken("some-token");
    expect(result).toEqual({
      ok: false,
      reason: AUTH_FAILURE_REASONS.EMAIL_NOT_VERIFIED,
    });
  });

  it("should return INVALID_RESPONSE reason when tokeninfo response is missing email field", () => {
    mockTokenInfoResponse({ email_verified: "true", sub: "123" });
    const result = verifyToken("some-token");
    expect(result).toEqual({
      ok: false,
      reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE,
    });
  });

  it("should return INVALID_RESPONSE reason when tokeninfo response is not a valid object", () => {
    mockTokenInfoResponse("invalid" as unknown as object);
    const result = verifyToken("some-token");
    expect(result).toEqual({
      ok: false,
      reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE,
    });
  });

  it("should return INVALID_RESPONSE when tokeninfo JSON body is null", () => {
    vi.mocked(UrlFetchApp.fetch).mockReturnValue({
      getResponseCode: () => 200,
      getContentText: () => "null",
    } as never);
    const result = verifyToken("some-token");
    expect(result).toEqual({
      ok: false,
      reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE,
    });
  });

  it("should return INVALID_RESPONSE when tokeninfo response has email but no email_verified field", () => {
    mockTokenInfoResponse({ email: VALID_EMAIL } as unknown as object);
    const result = verifyToken("some-token");
    expect(result).toEqual({
      ok: false,
      reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE,
    });
  });

  it("should call UrlFetchApp.fetch with the tokeninfo URL containing the token", () => {
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    verifyToken("my-access-token");
    const fetchCall = vi.mocked(UrlFetchApp.fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain("my-access-token");
    expect(fetchCall).toContain("googleapis.com");
  });

  it("should call UrlFetchApp.fetch with muteHttpExceptions: true", () => {
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    verifyToken("my-token");
    expect(UrlFetchApp.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ muteHttpExceptions: true }),
    );
  });

  it("should return INVALID_RESPONSE when response code is non-200 even if body looks valid", () => {
    vi.mocked(UrlFetchApp.fetch).mockReturnValue({
      getResponseCode: () => 401,
      getContentText: () =>
        JSON.stringify({ email: VALID_EMAIL, email_verified: "true" }),
    } as never);
    const result = verifyToken("expired-token");
    expect(result).toEqual({
      ok: false,
      reason: AUTH_FAILURE_REASONS.INVALID_RESPONSE,
    });
  });
});
