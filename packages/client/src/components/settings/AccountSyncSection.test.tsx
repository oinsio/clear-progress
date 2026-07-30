import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountSyncSection } from "./AccountSyncSection";

const { mockSetSyncInterval, mockSetAutoSyncDelay } = vi.hoisted(() => ({
  mockSetSyncInterval: vi.fn(),
  mockSetAutoSyncDelay: vi.fn(),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    syncInterval: 30,
    autoSyncDelay: 5,
    setSyncInterval: mockSetSyncInterval,
    setAutoSyncDelay: mockSetAutoSyncDelay,
  }),
}));

vi.mock("@/components/settings/SyncTimingSection", () => ({
  SyncTimingSection: () => (
    <section data-testid="settings-sync-timing">SyncTimingSection</section>
  ),
}));

vi.mock("@/components/settings/ServerSection", () => ({
  ServerSection: ({ oauthError }: { oauthError: string }) => (
    <section
      data-testid="settings-server-section"
      data-oauth-error={oauthError}
    >
      ServerSection
    </section>
  ),
}));

function renderSection(oauthError = "") {
  return render(<AccountSyncSection oauthError={oauthError} />);
}

// FR5: AccountSyncSection renders ServerSection
// FR8: AccountSyncSection renders SyncTimingSection above ServerSection
describe("AccountSyncSection", () => {
  it("should render the ServerSection", () => {
    renderSection();
    expect(screen.getByTestId("settings-server-section")).toBeInTheDocument();
  });

  it("should pass oauthError prop to ServerSection", () => {
    renderSection("test-error");
    expect(screen.getByTestId("settings-server-section")).toHaveAttribute(
      "data-oauth-error",
      "test-error",
    );
  });

  it("should pass empty oauthError when none provided", () => {
    renderSection("");
    expect(screen.getByTestId("settings-server-section")).toHaveAttribute(
      "data-oauth-error",
      "",
    );
  });

  it("should render the SyncTimingSection", () => {
    renderSection();
    expect(screen.getByTestId("settings-sync-timing")).toBeInTheDocument();
  });

  it("should render SyncTimingSection before ServerSection", () => {
    const { container } = renderSection();
    const syncTimingIndex = container.innerHTML.indexOf("settings-sync-timing");
    const serverSectionIndex = container.innerHTML.indexOf(
      "settings-server-section",
    );
    expect(syncTimingIndex).toBeGreaterThan(-1);
    expect(serverSectionIndex).toBeGreaterThan(-1);
    expect(syncTimingIndex).toBeLessThan(serverSectionIndex);
  });
});
