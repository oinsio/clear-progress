// implements FR6 of add-sidebar-specs
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PanelSide } from "@/types/common";

interface SidebarSyncBlockProps {
  isExpanded: boolean;
  side: PanelSide;
  onToggle?: () => void;
}

const { mockUseConnectionStatus, mockUseAuth, mockUseSync } = vi.hoisted(
  () => ({
    mockUseConnectionStatus: vi.fn(),
    mockUseAuth: vi.fn(),
    mockUseSync: vi.fn(),
  }),
);

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: mockUseConnectionStatus,
}));
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: mockUseAuth,
}));
vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: mockUseSync,
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Lazy import so mocks are in place
const { SidebarSyncBlock } = await import("./SidebarSyncBlock");

function renderSyncBlock(props: Partial<SidebarSyncBlockProps> = {}) {
  return render(
    <MemoryRouter>
      <SidebarSyncBlock isExpanded={true} side="right" {...props} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUseConnectionStatus.mockReturnValue("synced");
  mockUseAuth.mockReturnValue({ userPicture: null, signIn: vi.fn() });
  mockUseSync.mockReturnValue({ pull: vi.fn() });
});

describe("SidebarSyncBlock CSS — collapsed", () => {
  it("should add animate-spin to RefreshCw icon when syncing", () => {
    mockUseConnectionStatus.mockReturnValue("syncing");
    const { container } = renderSyncBlock({ isExpanded: false });
    const svgIcon = container.querySelector("svg");
    expect(svgIcon?.getAttribute("class") ?? "").toContain("animate-spin");
  });

  it("should not add animate-spin to RefreshCw icon when synced", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({ isExpanded: false });
    const svgIcon = container.querySelector("svg");
    expect(svgIcon?.getAttribute("class") ?? "").not.toContain("animate-spin");
  });

  it("should show error badge when offline", () => {
    mockUseConnectionStatus.mockReturnValue("offline");
    const { container } = renderSyncBlock({ isExpanded: false });
    const errorBadge = container.querySelector(".bg-red-500");
    expect(errorBadge).toBeTruthy();
  });

  it("should not show error badge when synced", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({ isExpanded: false });
    const errorBadge = container.querySelector(".bg-red-500");
    expect(errorBadge).toBeNull();
  });

  it("should show error badge when server error", () => {
    mockUseConnectionStatus.mockReturnValue("error");
    const { container } = renderSyncBlock({ isExpanded: false });
    const errorBadge = container.querySelector(".bg-red-500");
    expect(errorBadge).toBeTruthy();
  });

  it("should apply collapsed button classes for needsSignIn state", () => {
    mockUseConnectionStatus.mockReturnValue("unauthorized");
    renderSyncBlock({ isExpanded: false });
    const button = screen.getByTestId("sidebar-sign-in");
    expect(button.className).toContain("w-10");
    expect(button.className).toContain("h-10");
  });

  it("should apply collapsed button classes with relative for configured state", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    renderSyncBlock({ isExpanded: false });
    const button = screen.getByTestId("sidebar-sync");
    expect(button.className).toContain("w-10");
    expect(button.className).toContain("h-10");
    expect(button.className).toContain("relative");
  });

  it("should apply collapsed button classes for not_configured state", () => {
    mockUseConnectionStatus.mockReturnValue("not_configured");
    renderSyncBlock({ isExpanded: false });
    const button = screen.getByTestId("sidebar-account");
    expect(button.className).toContain("w-10");
    expect(button.className).toContain("h-10");
  });

  it("should render RefreshCw icon with w-6 h-6 in collapsed sync button", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({ isExpanded: false });
    const svgIcon = container.querySelector('[data-testid="sidebar-sync"] svg');
    expect(svgIcon?.getAttribute("class") ?? "").toContain("w-6");
    expect(svgIcon?.getAttribute("class") ?? "").toContain("h-6");
  });

  it("should render UserAvatar icon with w-6 h-6 when not_configured", () => {
    mockUseConnectionStatus.mockReturnValue("not_configured");
    const { container } = renderSyncBlock({ isExpanded: false });
    const svgIcon = container.querySelector("svg");
    expect(svgIcon?.getAttribute("class") ?? "").toContain("w-6");
    expect(svgIcon?.getAttribute("class") ?? "").toContain("h-6");
  });
});

describe("SidebarSyncBlock CSS — expanded", () => {
  it("should add animate-spin to RefreshCw icon when syncing", () => {
    mockUseConnectionStatus.mockReturnValue("syncing");
    const { container } = renderSyncBlock({ isExpanded: true });
    const svgIcon = container.querySelector('[data-testid="sidebar-sync"] svg');
    expect(svgIcon?.getAttribute("class") ?? "").toContain("animate-spin");
  });

  it("should not add animate-spin to RefreshCw icon when synced", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({ isExpanded: true });
    const svgIcon = container.querySelector('[data-testid="sidebar-sync"] svg');
    expect(svgIcon?.getAttribute("class") ?? "").not.toContain("animate-spin");
  });

  it("should show error badge when offline", () => {
    mockUseConnectionStatus.mockReturnValue("offline");
    const { container } = renderSyncBlock({ isExpanded: true });
    const errorBadge = container.querySelector(".bg-red-500");
    expect(errorBadge).toBeTruthy();
  });

  it("should apply flex-row-reverse to sync button when side is left", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    renderSyncBlock({ isExpanded: true, side: "left" });
    const syncButton = screen.getByTestId("sidebar-sync");
    expect(syncButton.className).toContain("flex-row-reverse");
  });

  it("should not apply flex-row-reverse to sync button when side is right", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    renderSyncBlock({ isExpanded: true, side: "right" });
    const syncButton = screen.getByTestId("sidebar-sync");
    expect(syncButton.className).not.toContain("flex-row-reverse");
  });

  it("should apply flex-1 and gap-2 classes on expanded sync button", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    renderSyncBlock({ isExpanded: true });
    const syncButton = screen.getByTestId("sidebar-sync");
    expect(syncButton.className).toContain("flex-1");
    expect(syncButton.className).toContain("gap-2");
  });

  it("should render RefreshCw icon with w-5 h-5 in expanded sync button", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({ isExpanded: true });
    const svgIcon = container.querySelector('[data-testid="sidebar-sync"] svg');
    expect(svgIcon?.getAttribute("class") ?? "").toContain("w-5");
    expect(svgIcon?.getAttribute("class") ?? "").toContain("h-5");
  });

  it("should render account button before sync button when side is left", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({ isExpanded: true, side: "left" });
    const wrapper = container.firstElementChild;
    const buttons = wrapper?.querySelectorAll("button");
    expect(buttons?.[0]?.dataset.testid).toBe("sidebar-account");
    expect(buttons?.[1]?.dataset.testid).toBe("sidebar-sync");
  });

  it("should render sync button before account button when side is right (no toggle)", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({ isExpanded: true, side: "right" });
    const wrapper = container.firstElementChild;
    const buttons = wrapper?.querySelectorAll("button");
    expect(buttons?.[0]?.dataset.testid).toBe("sidebar-sync");
    expect(buttons?.[1]?.dataset.testid).toBe("sidebar-account");
  });

  it("should render toggle button first when side is right and onToggle provided", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({
      isExpanded: true,
      side: "right",
      onToggle: vi.fn(),
    });
    const wrapper = container.firstElementChild;
    const buttons = wrapper?.querySelectorAll("button");
    expect(buttons?.[0]?.dataset.testid).toBe("sidebar-toggle-button");
    expect(buttons?.[1]?.dataset.testid).toBe("sidebar-sync");
    expect(buttons?.[2]?.dataset.testid).toBe("sidebar-account");
  });

  it("should render toggle button last when side is left and onToggle provided", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({
      isExpanded: true,
      side: "left",
      onToggle: vi.fn(),
    });
    const wrapper = container.firstElementChild;
    const buttons = wrapper?.querySelectorAll("button");
    expect(buttons?.[0]?.dataset.testid).toBe("sidebar-account");
    expect(buttons?.[1]?.dataset.testid).toBe("sidebar-sync");
    expect(buttons?.[2]?.dataset.testid).toBe("sidebar-toggle-button");
  });

  it("should have aria-label on toggle button", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    renderSyncBlock({ isExpanded: true, onToggle: vi.fn() });
    const toggleButton = screen.getByTestId("sidebar-toggle-button");
    expect(toggleButton.getAttribute("aria-label")).toBe("filter.closeSidebar");
  });
});

describe("SidebarSyncBlock CSS — UserAvatar", () => {
  it("should render img with rounded-full and w-8 h-8 when expanded with userPicture", () => {
    mockUseAuth.mockReturnValue({
      userPicture: "https://example.com/photo.jpg",
      signIn: vi.fn(),
    });
    const { container } = renderSyncBlock({ isExpanded: true });
    const avatarImage = container.querySelector("img");
    expect(avatarImage).toBeTruthy();
    expect(avatarImage?.className).toContain("rounded-full");
    expect(avatarImage?.className).toContain("w-8");
    expect(avatarImage?.className).toContain("h-8");
  });

  it("should render CircleUser with w-8 h-8 when expanded without userPicture", () => {
    mockUseAuth.mockReturnValue({ userPicture: null, signIn: vi.fn() });
    renderSyncBlock({ isExpanded: true });
    const accountButton = screen.getByTestId("sidebar-account");
    const svgIcon = accountButton.querySelector("svg");
    expect(svgIcon?.getAttribute("class") ?? "").toContain("w-8");
    expect(svgIcon?.getAttribute("class") ?? "").toContain("h-8");
  });

  it("should render img with w-6 h-6 when collapsed and not_configured with userPicture", () => {
    mockUseConnectionStatus.mockReturnValue("not_configured");
    mockUseAuth.mockReturnValue({
      userPicture: "https://example.com/photo.jpg",
      signIn: vi.fn(),
    });
    const { container } = renderSyncBlock({ isExpanded: false });
    const avatarImage = container.querySelector("img");
    expect(avatarImage).toBeTruthy();
    expect(avatarImage?.className).toContain("w-6");
    expect(avatarImage?.className).toContain("h-6");
  });
});
