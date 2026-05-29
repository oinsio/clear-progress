import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
const { mockUseConnectionStatus, mockUsePanelAlwaysOpen } = vi.hoisted(() => ({
  mockUseConnectionStatus: vi.fn(),
  mockUsePanelAlwaysOpen: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ userPicture: null, signIn: vi.fn() }),
}));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ syncStatus: "idle", pull: vi.fn() }),
}));

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: mockUseConnectionStatus,
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

vi.mock("@/hooks/usePanelAlwaysOpen", () => ({
  usePanelAlwaysOpen: mockUsePanelAlwaysOpen,
}));

import { Sidebar } from "./Sidebar";

function renderSidebar(overrides?: Partial<Parameters<typeof Sidebar>[0]>) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        isOpen={true}
        onToggle={vi.fn()}
        onModeChange={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

// implements FR6 of add-sidebar-specs
describe("Sidebar — CSS classes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionStatus.mockReturnValue("synced");
    mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: false });
  });

  it("should apply border-l on expanded panel when side is right (default)", () => {
    renderSidebar();
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("border-l");
    expect(panel.className).toContain("border-accent/70");
  });

  it("should apply border-r on expanded panel when side is left", () => {
    renderSidebar({ side: "left" });
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("border-r");
    expect(panel.className).toContain("border-accent/70");
  });

  it("should apply order-first and flex-row-reverse to outer wrapper when side is left and expanded", () => {
    renderSidebar({ side: "left" });
    const panel = screen.getByTestId("sidebar-toggle");
    const outerWrapper = panel.parentElement!;
    expect(outerWrapper.className).toContain("order-first");
    expect(outerWrapper.className).toContain("flex-row-reverse");
  });

  it("should not apply order-first to outer wrapper when side is right and expanded", () => {
    renderSidebar({ side: "right" });
    const panel = screen.getByTestId("sidebar-toggle");
    const outerWrapper = panel.parentElement!;
    expect(outerWrapper.className).not.toContain("order-first");
  });

  it("should apply cursor-pointer on expanded panel when isPanelAlwaysOpen is false", () => {
    mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: false });
    renderSidebar();
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("cursor-pointer");
  });

  it("should not apply cursor-pointer on expanded panel when isPanelAlwaysOpen is true", () => {
    mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: true });
    renderSidebar();
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).not.toContain("cursor-pointer");
  });

  it("should apply w-52 on expanded panel", () => {
    renderSidebar();
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("w-52");
  });

  it("should apply w-14 on collapsed panel", () => {
    renderSidebar({ isOpen: false });
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("w-14");
  });

  it("should apply left-0 on expanded panel when side is left", () => {
    renderSidebar({ side: "left" });
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("left-0");
  });

  it("should apply right-0 on expanded panel when side is right", () => {
    renderSidebar({ side: "right" });
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("right-0");
  });

  it("should apply absolute positioning classes on expanded panel", () => {
    renderSidebar();
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("absolute");
    expect(panel.className).toContain("top-0");
    expect(panel.className).toContain("bottom-0");
    expect(panel.className).toContain("z-20");
  });

  it("should apply bg-accent on expanded panel", () => {
    renderSidebar();
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("bg-accent");
  });

  it("should apply md:hidden w-14 flex-shrink-0 on mobile placeholder when expanded", () => {
    renderSidebar();
    const panel = screen.getByTestId("sidebar-toggle");
    const mobilePlaceholder = panel.previousElementSibling!;
    expect(mobilePlaceholder.className).toContain("md:hidden");
    expect(mobilePlaceholder.className).toContain("w-14");
    expect(mobilePlaceholder.className).toContain("flex-shrink-0");
  });

  it("should apply bg-accent on collapsed panel", () => {
    renderSidebar({ isOpen: false });
    const panel = screen.getByTestId("sidebar-toggle");
    expect(panel.className).toContain("bg-accent");
  });

  it("should apply order-first and flex-row-reverse to outer wrapper when side is left and collapsed", () => {
    renderSidebar({ side: "left", isOpen: false });
    const panel = screen.getByTestId("sidebar-toggle");
    const outerWrapper = panel.parentElement!;
    expect(outerWrapper.className).toContain("order-first");
    expect(outerWrapper.className).toContain("flex-row-reverse");
  });

  it("should not apply order-first to outer wrapper when side is right and collapsed", () => {
    renderSidebar({ side: "right", isOpen: false });
    const panel = screen.getByTestId("sidebar-toggle");
    const outerWrapper = panel.parentElement!;
    expect(outerWrapper.className).not.toContain("order-first");
  });
});
