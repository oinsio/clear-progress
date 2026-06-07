// Shared test utilities for gas_adapter BDD step files
import type { vi } from "vitest";

export const GAS_URL = "https://script.google.com/macros/s/test/exec";
export const VALID_TOKEN = "valid-test-token";

export type FeatureContext = Record<string, never>;

export function createJsonResponse(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function createValidInitResponse(): Response {
  return createJsonResponse({ ok: true });
}

export function extractFetchOptions(
  mockFetch: ReturnType<typeof vi.fn>,
): RequestInit {
  const [, fetchOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
  return fetchOptions;
}

export function extractFetchUrl(mockFetch: ReturnType<typeof vi.fn>): string {
  const [fetchUrl] = mockFetch.mock.calls[0] as [string, RequestInit];
  return fetchUrl;
}

export function extractRequestBody(
  mockFetch: ReturnType<typeof vi.fn>,
): Record<string, unknown> {
  const fetchOptions = extractFetchOptions(mockFetch);
  return JSON.parse(fetchOptions.body as string) as Record<string, unknown>;
}
