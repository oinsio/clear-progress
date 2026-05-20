import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  driveFileExists,
  getScriptPropertiesStore,
  init,
  initDefaults,
  MOCK_SPREADSHEET_ID,
  PROPERTY_KEYS,
  parseResponse,
  resetAndClear,
  setScriptProperty,
  setupFirstTimeInit,
} from "./init-test-utils";

vi.mock("../helpers/drive", () => ({ driveFileExists: vi.fn() }));
vi.mock("../sheets/settings.sheet", () => ({ initDefaults: vi.fn() }));
vi.mock("../sheets/meta.sheet", () => ({ initMetaSheet: vi.fn() }));

describe("init — already initialized", () => {
  beforeEach(() => {
    resetAndClear();
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, MOCK_SPREADSHEET_ID);
    vi.mocked(driveFileExists).mockReturnValue(true);
  });

  it("should return ok: true, created: false, spreadsheet_id when already initialized", () => {
    init();
    const response = parseResponse();
    expect(response.ok).toBe(true);
    expect(response.created).toBe(false);
    expect(response.spreadsheet_id).toBe(MOCK_SPREADSHEET_ID);
  });

  it("should not call Drive.Files.create when already initialized", () => {
    init();
    expect(Drive.Files.create).not.toHaveBeenCalled();
  });
});

describe("init — stale property (file deleted)", () => {
  beforeEach(() => {
    resetAndClear();
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, "stale-spreadsheet-id");
    vi.mocked(driveFileExists).mockReturnValue(false);
    vi.mocked(initDefaults).mockReturnValue(undefined);
    setupFirstTimeInit();
  });

  it("should clear stale properties and save new spreadsheet_id", () => {
    init();
    const store = getScriptPropertiesStore();
    expect(store[PROPERTY_KEYS.SPREADSHEET_ID]).toBe(MOCK_SPREADSHEET_ID);
  });

  it("should call Drive.Files.create 3 times when stale property found", () => {
    init();
    expect(Drive.Files.create).toHaveBeenCalledTimes(3);
  });
});
