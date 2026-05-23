import { vi } from "vitest";

export function mockTokenInfoResponse(data: object, statusCode = 200): void {
  vi.mocked(UrlFetchApp.fetch).mockReturnValue({
    getResponseCode: () => statusCode,
    getContentText: () => JSON.stringify(data),
  } as never);
}

export function mockTokenInfoHttpError(statusCode: number): void {
  vi.mocked(UrlFetchApp.fetch).mockReturnValue({
    getResponseCode: () => statusCode,
    getContentText: () => JSON.stringify({ error: "invalid_token" }),
  } as never);
}

export function mockTokenInfoError(): void {
  vi.mocked(UrlFetchApp.fetch).mockImplementation(() => {
    throw new Error("Network error");
  });
}

export function mockTokenInfoPermissionError(
  scope = "https://www.googleapis.com/auth/script.external_request",
): void {
  vi.mocked(UrlFetchApp.fetch).mockImplementation(() => {
    throw new Error(
      `You do not have permission to call UrlFetchApp.fetch. Required permissions: ${scope}.`,
    );
  });
}

export const VALID_EMAIL = "owner@example.com";
export const OTHER_EMAIL = "other@example.com";

export const VALID_TOKEN_INFO = {
  email: VALID_EMAIL,
  email_verified: "true",
  sub: "12345",
};
