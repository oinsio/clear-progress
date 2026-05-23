import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetScriptProperties,
  setScriptProperty,
} from "../../../tests/server/setup/gas-mocks";
import { verifyToken } from "./auth";
import {
  mockTokenInfoResponse,
  OTHER_EMAIL,
  VALID_EMAIL,
  VALID_TOKEN_INFO,
} from "./auth-test-utils";
import { AUTH_FAILURE_REASONS, PROPERTY_KEYS } from "./constants";

describe("verifyToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
  });

  it("should self-register OWNER_EMAIL on first valid call and return ok with email", () => {
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    const result = verifyToken("first-token");
    expect(result).toEqual({ ok: true, email: VALID_EMAIL });
    expect(
      PropertiesService.getScriptProperties().getProperty(
        PROPERTY_KEYS.OWNER_EMAIL,
      ),
    ).toBe(VALID_EMAIL);
  });

  it("should return ok with email when token matches registered OWNER_EMAIL", () => {
    setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
    mockTokenInfoResponse(VALID_TOKEN_INFO);
    const result = verifyToken("valid-token");
    expect(result).toEqual({ ok: true, email: VALID_EMAIL });
  });

  it("should return WRONG_ACCOUNT reason when token email does not match registered OWNER_EMAIL", () => {
    setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
    mockTokenInfoResponse({ email: OTHER_EMAIL, email_verified: "true" });
    const result = verifyToken("other-token");
    expect(result).toEqual({
      ok: false,
      reason: AUTH_FAILURE_REASONS.WRONG_ACCOUNT,
    });
  });

  it("should not overwrite OWNER_EMAIL if already registered", () => {
    setScriptProperty(PROPERTY_KEYS.OWNER_EMAIL, VALID_EMAIL);
    mockTokenInfoResponse({ email: OTHER_EMAIL, email_verified: "true" });
    verifyToken("token");
    expect(
      PropertiesService.getScriptProperties().getProperty(
        PROPERTY_KEYS.OWNER_EMAIL,
      ),
    ).toBe(VALID_EMAIL);
  });
});
