import { cleanup, render, screen } from "@testing-library/react/pure";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SyncIndicator } from "./SyncIndicator";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("SyncIndicator", () => {
  afterEach(cleanup);

  // FR8: renders cloud icon for synced settings
  it.each([
    "accent_color",
    "custom_accent_colors",
    "default_box",
    "day_boundary",
  ])("should render cloud icon when settingKey is '%s'", (settingKey) => {
    render(<SyncIndicator settingKey={settingKey} />);
    expect(screen.getByTestId("sync-indicator")).toBeInTheDocument();
  });

  // FR8: does not render for non-synced settings
  it("should render nothing when settingKey is not in SYNCED_SETTING_KEYS", () => {
    const { container } = render(<SyncIndicator settingKey="language" />);
    expect(container.innerHTML).toBe("");
  });

  // NFR-A2: aria-label for accessibility
  it("should have aria-label with i18n key on the cloud icon", () => {
    render(<SyncIndicator settingKey="accent_color" />);
    const indicator = screen.getByTestId("sync-indicator");
    expect(indicator).toHaveAttribute("aria-label", "settings.syncIndicator");
  });

  // FR8: renders SVG icon
  it("should render an SVG element inside the indicator", () => {
    const { container } = render(<SyncIndicator settingKey="default_box" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
