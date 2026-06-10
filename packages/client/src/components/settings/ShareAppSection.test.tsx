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
    copyLink: vi.fn(),
    copyResult: "idle",
    resetCopyResult: vi.fn(),
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

  it("should render copy link button label from i18n key", () => {
    renderSection();
    expect(screen.getByText("share.copyLinkButton")).toBeInTheDocument();
  });
});

// FR4: Copy link button
describe("ShareAppSection copy link button", () => {
  it("should render the section container", () => {
    renderSection();
    expect(screen.getByTestId("settings-share-app")).toBeInTheDocument();
  });

  it("should call copyLink when copy link button is clicked", () => {
    const mockReturn = renderSection();
    fireEvent.click(screen.getByTestId("copy-link-button"));
    expect(mockReturn.copyLink).toHaveBeenCalledOnce();
  });
});

// FR5: Dialog with copied message
describe("ShareAppSection clipboard dialog", () => {
  it("should show dialog with copied message when copyResult is copied", () => {
    renderSection({ copyResult: "copied" });
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-dialog-message")).toHaveTextContent(
      "share.linkCopied",
    );
  });

  it("should render dialog title from i18n key", () => {
    renderSection({ copyResult: "copied" });
    expect(screen.getByTestId("confirm-dialog-title")).toHaveTextContent(
      "share.title",
    );
  });

  it("should render single OK button from i18n key", () => {
    renderSection({ copyResult: "copied" });
    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "share.ok",
    );
  });

  it("should not render a cancel button", () => {
    renderSection({ copyResult: "copied" });
    expect(
      screen.queryByTestId("confirm-dialog-cancel"),
    ).not.toBeInTheDocument();
  });
});

// FR6, UX5: Dialog interactions
describe("ShareAppSection dialog interactions", () => {
  it("should not show dialog when copyResult is idle", () => {
    renderSection({ copyResult: "idle" });
    expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
  });

  it("should show dialog when copyResult is copied", () => {
    renderSection({ copyResult: "copied" });
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
  });

  it("should show dialog when copyResult is error", () => {
    renderSection({ copyResult: "error" });
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
  });

  it("should show error message when copyResult is error", () => {
    renderSection({ copyResult: "error" });
    expect(screen.getByTestId("confirm-dialog-message")).toHaveTextContent(
      "share.copyFailed",
    );
  });

  it("should call resetCopyResult when OK button is clicked", () => {
    const mockReturn = renderSection({ copyResult: "copied" });
    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    expect(mockReturn.resetCopyResult).toHaveBeenCalledOnce();
  });

  it("should call resetCopyResult when Escape key is pressed", () => {
    const mockReturn = renderSection({ copyResult: "copied" });
    fireEvent.keyDown(screen.getByTestId("confirm-dialog"), {
      key: "Escape",
    });
    expect(mockReturn.resetCopyResult).toHaveBeenCalledOnce();
  });

  it("should not call resetCopyResult when non-Escape key is pressed", () => {
    const mockReturn = renderSection({ copyResult: "copied" });
    fireEvent.keyDown(screen.getByTestId("confirm-dialog"), {
      key: "Enter",
    });
    expect(mockReturn.resetCopyResult).not.toHaveBeenCalled();
  });

  it("should call resetCopyResult when backdrop is clicked", () => {
    const mockReturn = renderSection({ copyResult: "copied" });
    fireEvent.click(screen.getByTestId("confirm-dialog"));
    expect(mockReturn.resetCopyResult).toHaveBeenCalledOnce();
  });

  it("should not call resetCopyResult when inner dialog content is clicked", () => {
    const mockReturn = renderSection({ copyResult: "copied" });
    fireEvent.click(screen.getByTestId("confirm-dialog-message"));
    expect(mockReturn.resetCopyResult).not.toHaveBeenCalled();
  });
});

// NFR-A1, NFR-A2, NFR-A3: Accessibility
describe("ShareAppSection accessibility", () => {
  it("should have aria-label on copy link button", () => {
    renderSection();
    const copyButton = screen.getByTestId("copy-link-button");
    expect(copyButton).toHaveAttribute("aria-label", "share.copyLinkButton");
  });

  it("should render alertdialog role when dialog is visible", () => {
    renderSection({ copyResult: "copied" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("should focus OK button when dialog appears", () => {
    renderSection({ copyResult: "copied" });
    const okButton = screen.getByTestId("confirm-dialog-confirm");
    expect(okButton).toHaveFocus();
  });
});
