import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountSyncSection } from "./AccountSyncSection";

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
});
