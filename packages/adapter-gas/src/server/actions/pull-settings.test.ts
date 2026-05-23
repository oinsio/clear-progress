import { describe, expect, it, vi } from "vitest";
import { pull } from "./pull";
import {
  getAllSettings,
  getSettingsChangedSince,
  parseResponse,
  setupPullTests,
} from "./pull-test-utils";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/ideas.sheet");
vi.mock("../sheets/settings.sheet");
vi.mock("../sheets/meta.sheet");

describe("pull — settings_updated_at parameter", () => {
  setupPullTests();

  it("should call getAllSettings when settings_updated_at is not provided", () => {
    pull({ since_revision: 0 });

    expect(getAllSettings).toHaveBeenCalledTimes(1);
    expect(getSettingsChangedSince).not.toHaveBeenCalled();
  });

  it("should call getSettingsChangedSince when settings_updated_at is provided", () => {
    pull({
      since_revision: 0,
      settings_updated_at: "2026-04-15T10:00:00.000Z",
    });

    expect(getSettingsChangedSince).toHaveBeenCalledWith(
      "2026-04-15T10:00:00.000Z",
    );
    expect(getAllSettings).not.toHaveBeenCalled();
  });

  it("should return all settings when settings_updated_at is not provided", () => {
    const allSettings = [
      {
        key: "default_box",
        value: "inbox",
        updated_at: "2026-04-10T00:00:00.000Z",
      },
      {
        key: "accent_color",
        value: "green",
        updated_at: "2026-04-15T00:00:00.000Z",
      },
    ];
    vi.mocked(getAllSettings).mockReturnValue(allSettings);

    pull({ since_revision: 0 });

    expect(parseResponse().settings).toEqual(allSettings);
  });

  it("should return only changed settings when settings_updated_at is provided", () => {
    const changedSettings = [
      {
        key: "accent_color",
        value: "blue",
        updated_at: "2026-04-16T00:00:00.000Z",
      },
    ];
    vi.mocked(getSettingsChangedSince).mockReturnValue(changedSettings);

    pull({
      since_revision: 0,
      settings_updated_at: "2026-04-15T10:00:00.000Z",
    });

    expect(parseResponse().settings).toEqual(changedSettings);
  });

  it("should return empty settings array when no settings changed since given time", () => {
    vi.mocked(getSettingsChangedSince).mockReturnValue([]);

    pull({
      since_revision: 0,
      settings_updated_at: "2026-04-15T10:00:00.000Z",
    });

    expect(parseResponse().settings).toEqual([]);
  });
});
