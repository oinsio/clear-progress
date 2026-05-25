import type { vi } from "vitest";

export const globals = globalThis as unknown as {
  doGet?: (
    e: GoogleAppsScript.Events.DoGet,
  ) => GoogleAppsScript.Content.TextOutput;
  doPost?: (
    e: GoogleAppsScript.Events.DoPost,
  ) => GoogleAppsScript.Content.TextOutput;
};

export const VALID_TOKEN = "valid-access-token";
export const OWNER_EMAIL = "owner@example.com";

export function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>)
    .mock.calls;
  return JSON.parse(calls[calls.length - 1]?.[0] ?? "{}");
}

export function callDoGet(
  event: GoogleAppsScript.Events.DoGet,
): GoogleAppsScript.Content.TextOutput {
  if (!globals.doGet) throw new Error("doGet is not initialized");
  return globals.doGet(event);
}

export function callDoPost(
  event: GoogleAppsScript.Events.DoPost,
): GoogleAppsScript.Content.TextOutput {
  if (!globals.doPost) throw new Error("doPost is not initialized");
  return globals.doPost(event);
}

export function makeGetEvent(
  params: Record<string, string> = {},
): GoogleAppsScript.Events.DoGet {
  return { parameter: params } as never;
}

export function makePostEvent(body: unknown): GoogleAppsScript.Events.DoPost {
  return { postData: { contents: JSON.stringify(body) } } as never;
}

export function makePostEventRaw(raw: string): GoogleAppsScript.Events.DoPost {
  return { postData: { contents: raw } } as never;
}

/** Creates a POST event with a valid access_token included */
export function makeAuthenticatedPostEvent(
  body: Record<string, unknown>,
): GoogleAppsScript.Events.DoPost {
  return makePostEvent({ ...body, access_token: VALID_TOKEN });
}
