import type { vi } from "vitest";

export function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>)
    .mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

export function getResults(): Record<string, unknown[]> {
  return parseResponse().results as Record<string, unknown[]>;
}
