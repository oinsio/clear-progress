import { describe, expect, it, vi } from "vitest";
import { PUSH_STATUSES } from "../helpers/constants";
import { getAllSettings, upsertSettings } from "../sheets/settings.sheet";
import type { Setting } from "../types";
import { push } from "./push";
import { getResults, setupPushTests } from "./push-test-utils";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/settings.sheet");
vi.mock("../sheets/meta.sheet");

describe("push", () => {
  setupPushTests();

  describe("settings", () => {
    it("should call upsertSettings once with all accepted settings", () => {
      const settings: Setting[] = [
        {
          key: "default_box",
          value: "today",
          updated_at: "2025-01-01T00:00:00.000Z",
        },
        {
          key: "accent_color",
          value: "purple",
          updated_at: "2025-01-01T00:00:00.000Z",
        },
      ];

      push({ settings });

      expect(upsertSettings).toHaveBeenCalledTimes(1);
      expect(upsertSettings).toHaveBeenCalledWith(settings);
    });

    it("should return accepted status for each setting using key as id", () => {
      const settings: Setting[] = [
        {
          key: "default_box",
          value: "today",
          updated_at: "2025-01-01T00:00:00.000Z",
        },
      ];

      push({ settings });

      const results = getResults();
      expect(results.settings![0]).toMatchObject({
        key: "default_box",
        status: PUSH_STATUSES.ACCEPTED,
      });
    });

    it("should not call upsertSettings when settings array is empty", () => {
      push({ settings: [] });
      expect(upsertSettings).not.toHaveBeenCalled();
    });

    it("should upsert setting when server does not have it yet", () => {
      const clientSetting: Setting = {
        key: "default_box",
        value: "today",
        updated_at: "2026-03-21T10:00:00.000Z",
      };

      push({ settings: [clientSetting] });

      expect(upsertSettings).toHaveBeenCalledWith([clientSetting]);
    });

    it("should upsert setting when client updated_at is newer than server", () => {
      const clientSetting: Setting = {
        key: "default_box",
        value: "today",
        updated_at: "2026-03-21T12:00:00.000Z",
      };
      vi.mocked(getAllSettings).mockReturnValue([
        {
          key: "default_box",
          value: "inbox",
          updated_at: "2026-03-21T10:00:00.000Z",
        },
      ]);

      push({ settings: [clientSetting] });

      expect(upsertSettings).toHaveBeenCalledWith([clientSetting]);
    });

    it("should return accepted when client updated_at is newer than server", () => {
      const clientSetting: Setting = {
        key: "default_box",
        value: "today",
        updated_at: "2026-03-21T12:00:00.000Z",
      };
      vi.mocked(getAllSettings).mockReturnValue([
        {
          key: "default_box",
          value: "inbox",
          updated_at: "2026-03-21T10:00:00.000Z",
        },
      ]);

      push({ settings: [clientSetting] });

      const results = getResults();
      expect(results.settings![0]).toMatchObject({
        key: "default_box",
        status: PUSH_STATUSES.ACCEPTED,
      });
    });

    it("should not upsert any setting when server updated_at is newer than client", () => {
      const clientSetting: Setting = {
        key: "default_box",
        value: "today",
        updated_at: "2026-03-21T10:00:00.000Z",
      };
      vi.mocked(getAllSettings).mockReturnValue([
        {
          key: "default_box",
          value: "week",
          updated_at: "2026-03-21T12:00:00.000Z",
        },
      ]);

      push({ settings: [clientSetting] });

      expect(upsertSettings).toHaveBeenCalledWith([]);
    });

    it("should return conflict when server updated_at is newer than client", () => {
      const clientSetting: Setting = {
        key: "default_box",
        value: "today",
        updated_at: "2026-03-21T10:00:00.000Z",
      };
      vi.mocked(getAllSettings).mockReturnValue([
        {
          key: "default_box",
          value: "week",
          updated_at: "2026-03-21T12:00:00.000Z",
        },
      ]);

      push({ settings: [clientSetting] });

      const results = getResults();
      expect(results.settings![0]).toMatchObject({
        key: "default_box",
        status: PUSH_STATUSES.CONFLICT,
      });
    });

    it("should match setting by key not by position when multiple server settings exist", () => {
      vi.mocked(getAllSettings).mockReturnValue([
        {
          key: "default_box",
          value: "inbox",
          updated_at: "2025-01-02T00:00:00.000Z",
        },
        {
          key: "accent_color",
          value: "green",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ]);

      const clientSetting: Setting = {
        key: "accent_color",
        value: "purple",
        updated_at: "2025-01-01T00:00:00.000Z",
      };
      push({ settings: [clientSetting] });

      const results = getResults();
      expect(results.settings![0]).toMatchObject({
        key: "accent_color",
        status: PUSH_STATUSES.ACCEPTED,
      });
    });
  });
});
