import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseShareReturn } from "@/hooks/useShare";
import { ShareAppSection } from "./ShareAppSection";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUseShare = vi.fn<() => UseShareReturn>();

vi.mock("@/hooks/useShare", () => ({
  useShare: () => mockUseShare(),
}));

function createMockShareReturn(
  overrides: Partial<UseShareReturn> = {},
): UseShareReturn {
  return {
    shareApp: vi.fn(),
    shareResult: "idle",
    resetShareResult: vi.fn(),
    ...overrides,
  };
}

function renderSection(shareReturn?: Partial<UseShareReturn>) {
  const mockReturn = createMockShareReturn(shareReturn);
  mockUseShare.mockReturnValue(mockReturn);
  render(<ShareAppSection />);
  return mockReturn;
}

// FR7: i18n — section title, description, button label
describe("ShareAppSection i18n", () => {
  it("should render section title from i18n key", () => {
    renderSection();
    expect(screen.getByText("share.title")).toBeInTheDocument();
  });

  it("should render description from i18n key", () => {
    renderSection();
    expect(screen.getByText("share.description")).toBeInTheDocument();
  });

  it("should render button label from i18n key", () => {
    renderSection();
    expect(screen.getByText("share.button")).toBeInTheDocument();
  });
});

// FR3: Web Share API path
describe("ShareAppSection share button", () => {
  it("should render the section container", () => {
    renderSection();
    expect(screen.getByTestId("settings-share-app")).toBeInTheDocument();
  });

  it("should call shareApp when share button is clicked", () => {
    const mockReturn = renderSection();
    fireEvent.click(screen.getByTestId("share-app-button"));
    expect(mockReturn.shareApp).toHaveBeenCalledOnce();
  });
});

// FR4: Clipboard fallback — dialog with copied message
describe("ShareAppSection clipboard fallback dialog", () => {
  it("should show dialog with copied message when shareResult is copied", () => {
    renderSection({ shareResult: "copied" });
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-dialog-message")).toHaveTextContent(
      "share.linkCopied",
    );
  });

  it("should render dialog title from i18n key", () => {
    renderSection({ shareResult: "copied" });
    expect(screen.getByTestId("confirm-dialog-title")).toHaveTextContent(
      "share.title",
    );
  });

  it("should render confirm button label from i18n key", () => {
    renderSection({ shareResult: "copied" });
    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "share.ok",
    );
  });

  it("should render cancel button label from i18n key", () => {
    renderSection({ shareResult: "copied" });
    expect(screen.getByTestId("confirm-dialog-cancel")).toHaveTextContent(
      "share.ok",
    );
  });
});

// FR6, UX5: Dialog interactions
describe("ShareAppSection dialog interactions", () => {
  it("should not show dialog when shareResult is idle", () => {
    renderSection({ shareResult: "idle" });
    expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
  });

  it("should show dialog when shareResult is copied", () => {
    renderSection({ shareResult: "copied" });
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
  });

  it("should show dialog when shareResult is error", () => {
    renderSection({ shareResult: "error" });
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
  });

  it("should show error message when shareResult is error", () => {
    renderSection({ shareResult: "error" });
    expect(screen.getByTestId("confirm-dialog-message")).toHaveTextContent(
      "share.copyFailed",
    );
  });

  it("should call resetShareResult when confirm button is clicked", () => {
    const mockReturn = renderSection({ shareResult: "copied" });
    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    expect(mockReturn.resetShareResult).toHaveBeenCalledOnce();
  });

  it("should call resetShareResult when cancel button is clicked", () => {
    const mockReturn = renderSection({ shareResult: "copied" });
    fireEvent.click(screen.getByTestId("confirm-dialog-cancel"));
    expect(mockReturn.resetShareResult).toHaveBeenCalledOnce();
  });
});

// NFR-A1, NFR-A2, NFR-A3: Accessibility
describe("ShareAppSection accessibility", () => {
  it("should have aria-label on share button", () => {
    renderSection();
    const shareButton = screen.getByTestId("share-app-button");
    expect(shareButton).toHaveAttribute("aria-label", "share.button");
  });

  it("should render alertdialog role when dialog is visible", () => {
    renderSection({ shareResult: "copied" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
