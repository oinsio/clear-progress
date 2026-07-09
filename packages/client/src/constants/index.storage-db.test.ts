import { describe, expect, it } from "vitest";
import { DB_NAME, STORAGE_KEYS } from "./index";

describe("DB_NAME", () => {
  it("should be 'clear-progress'", () => {
    expect(DB_NAME).toBe("clear-progress");
  });
});

// implements FR16 of localstorage-refactor
describe("STORAGE_KEYS", () => {
  it("should have non-empty string values", () => {
    for (const value of Object.values(STORAGE_KEYS)) {
      expect(value).toBeTruthy();
      expect(typeof value).toBe("string");
    }
  });

  const ALL_STORAGE_KEY_ENTRIES: [string, string][] = [
    ["CONNECTION_CONFIG", "connection_config"],
    ["LAST_SYNC", "last_sync"],
    ["ACCENT_COLOR", "accent_color"],
    ["CUSTOM_ACCENT_LIGHT", "custom_accent_light"],
    ["CUSTOM_ACCENT_DARK", "custom_accent_dark"],
    ["DEFAULT_BOX", "default_box"],
    ["PANEL_SIDE", "panel_side"],
    ["SIDEBAR_MODE", "sidebar_mode"],
    ["LANGUAGE", "language"],
    ["PANEL_SPLIT", "panel_split"],
    ["FILTER_BAR_POSITION", "filter_bar_position"],
    ["INTERFACE_SCALE", "interface_scale"],
    ["MENU_ORDER", "menu_order"],
    ["SECTION_COLLAPSE", "section_collapse"],
    ["COLOR_SCHEME", "color_scheme"],
    ["USER_PICTURE", "user_picture"],
    ["ACCESS_TOKEN", "access_token"],
    ["ACCESS_TOKEN_EXPIRES_AT", "access_token_expires_at"],
    ["SHOW_HIDDEN_TASKS", "show_hidden_tasks"],
    ["SETTINGS_UPDATED_AT", "settings_updated_at"],
    ["FOCUS_MODE", "focus_mode"],
    ["FOCUS_OPACITY", "focus_opacity"],
    ["HANDEDNESS", "handedness"],
    ["DAY_BOUNDARY", "day_boundary"],
    ["ONBOARDING_SHOWN", "onboarding_shown"],
    ["DETAIL_PANEL_PINNED", "detail_panel_pinned"],
    ["GOAL_FILTER", "goal_filter"],
  ];

  it.each(
    ALL_STORAGE_KEY_ENTRIES,
  )('STORAGE_KEYS.%s should be "%s"', (keyName, expectedValue) => {
    expect(STORAGE_KEYS[keyName as keyof typeof STORAGE_KEYS]).toBe(
      expectedValue,
    );
  });

  it("should cover every key in STORAGE_KEYS (completeness)", () => {
    const testedKeyNames = ALL_STORAGE_KEY_ENTRIES.map(([keyName]) => keyName);
    const actualKeyNames = Object.keys(STORAGE_KEYS);
    expect(testedKeyNames.sort()).toEqual(actualKeyNames.sort());
  });
});

// implements FR13 of localstorage-refactor — SETTING_KEYS removed; all code uses STORAGE_KEYS instead
