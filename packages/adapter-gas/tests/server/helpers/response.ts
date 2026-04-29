import type { vi } from "vitest";
import type {
  PushItemResult,
  PushSettingResult,
} from "../../../src/server/types";

export interface PushResults {
  tasks?: PushItemResult[];
  goals?: PushItemResult[];
  contexts?: PushItemResult[];
  categories?: PushItemResult[];
  checklist_items?: PushItemResult[];
  ideas?: PushItemResult[];
  settings?: PushSettingResult[];
}

export function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>)
    .mock.calls;
  const lastCall = calls[calls.length - 1];
  if (!lastCall) {
    throw new Error("No calls to ContentService.createTextOutput");
  }
  return JSON.parse(lastCall[0]);
}

export function getResults(): PushResults {
  return parseResponse().results as PushResults;
}
