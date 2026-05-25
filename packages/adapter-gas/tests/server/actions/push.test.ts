import { beforeEach, describe, expect, it, vi } from "vitest";
import { push } from "../../../src/server/actions/push";
import { PUSH_STATUSES } from "../../../src/server/helpers/constants";
import { parseResponse } from "../helpers";
import {
  getMockLock,
  resetScriptProperties,
  setScriptProperty,
} from "../setup/gas-mocks";

// Mock all sheet modules
vi.mock("../../../src/server/sheets/tasks.sheet", () => ({
  getAllTasks: vi.fn().mockReturnValue([]),
  upsertTasks: vi.fn(),
}));
vi.mock("../../../src/server/sheets/goals.sheet", () => ({
  getAllGoals: vi.fn().mockReturnValue([]),
  upsertGoals: vi.fn(),
}));
vi.mock("../../../src/server/sheets/contexts.sheet", () => ({
  getAllContexts: vi.fn().mockReturnValue([]),
  upsertContexts: vi.fn(),
}));
vi.mock("../../../src/server/sheets/categories.sheet", () => ({
  getAllCategories: vi.fn().mockReturnValue([]),
  upsertCategories: vi.fn(),
}));
vi.mock("../../../src/server/sheets/checklists.sheet", () => ({
  getAllChecklistItems: vi.fn().mockReturnValue([]),
  upsertChecklistItems: vi.fn(),
}));
vi.mock("../../../src/server/sheets/ideas.sheet", () => ({
  getAllIdeas: vi.fn().mockReturnValue([]),
  upsertIdeas: vi.fn(),
}));
vi.mock("../../../src/server/sheets/settings.sheet", () => ({
  getAllSettings: vi.fn().mockReturnValue([]),
  upsertSettings: vi.fn(),
}));
vi.mock("../../../src/server/sheets/meta.sheet", () => ({
  readNextRevision: vi.fn().mockReturnValue(1),
  saveNextRevision: vi.fn(),
}));
vi.mock("../../../src/server/sheets/client", () => ({
  getSpreadsheet: vi.fn(),
  getSheet: vi.fn(),
}));

const { getAllSettings, upsertSettings } = await import(
  "../../../src/server/sheets/settings.sheet"
);
const { readNextRevision } = await import(
  "../../../src/server/sheets/meta.sheet"
);

describe("push action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
    setScriptProperty("SPREADSHEET_ID", "test-ss");
    vi.mocked(readNextRevision).mockReturnValue(1);
    vi.mocked(getAllSettings).mockReturnValue([]);
    getMockLock().tryLock.mockReturnValue(true);
  });

  describe("lock timeout", () => {
    it("should return error when lock cannot be acquired", () => {
      getMockLock().tryLock.mockReturnValue(false);

      push({});
      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe("SYNC_LOCK_TIMEOUT");
      expect(response.message).toBe("Could not acquire sync lock");
    });
  });

  describe("settings comparison", () => {
    it("should accept client setting when client is strictly newer", () => {
      vi.mocked(getAllSettings).mockReturnValue([
        {
          key: "accent_color",
          value: "blue",
          updated_at: "2025-01-01T00:00:00.000Z",
        },
      ]);

      push({
        settings: [
          {
            key: "accent_color",
            value: "green",
            updated_at: "2025-01-02T00:00:00.000Z",
          },
        ],
      });

      const response = parseResponse();
      const settings = response.results as Record<string, unknown[]>;
      expect((settings.settings[0] as Record<string, unknown>).status).toBe(
        PUSH_STATUSES.ACCEPTED,
      );
      expect(upsertSettings).toHaveBeenCalled();
    });

    it("should accept client setting when timestamps are equal", () => {
      vi.mocked(getAllSettings).mockReturnValue([
        {
          key: "accent_color",
          value: "blue",
          updated_at: "2025-01-01T00:00:00.000Z",
        },
      ]);

      push({
        settings: [
          {
            key: "accent_color",
            value: "green",
            updated_at: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      const response = parseResponse();
      const settings = response.results as Record<string, unknown[]>;
      expect((settings.settings[0] as Record<string, unknown>).status).toBe(
        PUSH_STATUSES.ACCEPTED,
      );
    });

    it("should conflict when server setting is newer", () => {
      vi.mocked(getAllSettings).mockReturnValue([
        {
          key: "accent_color",
          value: "blue",
          updated_at: "2025-01-02T00:00:00.000Z",
        },
      ]);

      push({
        settings: [
          {
            key: "accent_color",
            value: "green",
            updated_at: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      const response = parseResponse();
      const settings = response.results as Record<string, unknown[]>;
      expect((settings.settings[0] as Record<string, unknown>).status).toBe(
        PUSH_STATUSES.CONFLICT,
      );
    });

    it("should accept new setting when no server record exists", () => {
      vi.mocked(getAllSettings).mockReturnValue([]);

      push({
        settings: [
          {
            key: "new_key",
            value: "val",
            updated_at: "2025-01-01T00:00:00.000Z",
          },
        ],
      });

      const response = parseResponse();
      const settings = response.results as Record<string, unknown[]>;
      expect((settings.settings[0] as Record<string, unknown>).status).toBe(
        PUSH_STATUSES.ACCEPTED,
      );
    });
  });

  describe("server_time", () => {
    it("should include valid server_time in response", () => {
      push({});
      const response = parseResponse();
      expect(response.server_time).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });
  });

  describe("empty push", () => {
    it("should return results without revision for empty changes", () => {
      push({});
      const response = parseResponse();
      expect(response.ok).toBe(true);
      expect(response.revision).toBeUndefined();
    });
  });
});
