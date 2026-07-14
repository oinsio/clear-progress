import { vi } from "vitest";
import { DEFAULT_DAY_BOUNDARY } from "@/constants";

/**
 * Shared mutable state behind the `@/hooks/useSettings` mock below.
 * Test setups (e.g. activeTasksPage.testSetup) mutate these fields to
 * control what the page under test sees; defaults match the previous
 * hardcoded mock values, so importers that never touch this state keep
 * the exact same behavior.
 */
export const settingsMockState = {
  defaultBox: "today",
  dayBoundary: DEFAULT_DAY_BOUNDARY,
};

vi.mock("@/hooks/useShowHidden", () => ({
  useShowHidden: () => ({
    showHidden: false,
    toggleShowHidden: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    get defaultBox() {
      return settingsMockState.defaultBox;
    },
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn(),
    setAccentColor: vi.fn(),
  }),
  getCachedDayBoundary: () => settingsMockState.dayBoundary,
}));

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: "bottom",
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({
    handedness: "right",
    setHandedness: vi.fn(),
  }),
}));
