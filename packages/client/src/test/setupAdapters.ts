import type { SyncAdapter } from "@clear-progress/contract";
import { vi } from "vitest";

export function setupMockAdapter(): SyncAdapter {
  return {
    ping: vi.fn().mockResolvedValue({ ok: true, initialized: true }),
    init: vi.fn().mockResolvedValue({ ok: true }),
    pull: vi.fn().mockResolvedValue({
      ok: true,
      current_revision: 1,
      purge_revision: 0,
      server_time: "2026-04-29T00:00:00.000Z",
      tasks: [],
      goals: [],
      contexts: [],
      categories: [],
      checklist_items: [],
      ideas: [],
      settings: [],
    }),
    push: vi.fn().mockResolvedValue({
      ok: true,
      revision: 1,
      server_time: "2026-04-29T00:00:00.000Z",
      tasks: [],
      goals: [],
      contexts: [],
      categories: [],
      checklist_items: [],
      ideas: [],
      settings: [],
    }),
    purge: vi.fn().mockResolvedValue({ ok: true }),
    uploadCover: vi.fn().mockResolvedValue({
      ok: true,
      data_hash: "test-data-hash",
      reused: false,
    }),
    uploadCovers: vi.fn().mockResolvedValue({ ok: true, results: [] }),
    getCover: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
    deleteCover: vi.fn().mockResolvedValue({ ok: true }),
  };
}
