/**
 * Tests for DeletedPage — section key uniqueness and collapse integration.
 * Implements FR18, FR21 of swipeable-item.
 */
import { describe, expect, it, vi } from "vitest";
import { useSectionCollapse } from "@/hooks/useSectionCollapse";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { renderDeletedPage } from "./deletedPage.testSetup";

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({
    accessToken: null,
    userEmail: null,
    userPicture: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/useDeletedEntities");
vi.mock("@/hooks/useRestoreEntity");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/usePurge");
vi.mock("@/hooks/useSidebarNavigation");
vi.mock("@/hooks/useSectionCollapse");

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

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => false,
}));

const mockUseSectionCollapse = vi.mocked(useSectionCollapse);

function setupMocksAndRender() {
  mockUseSectionCollapse.mockReturnValue({
    isCollapsed: false,
    toggleCollapse: vi.fn(),
  });

  renderDeletedPage({
    tasks: [buildTask({ is_deleted: true })],
    goals: [buildGoal({ is_deleted: true })],
    ideas: [buildIdea({ is_deleted: true })],
    contexts: [buildContext({ is_deleted: true })],
    categories: [buildCategory({ is_deleted: true })],
    checklistItems: [buildChecklistItem({ is_deleted: true })],
  });
}

const EXPECTED_SECTION_KEYS = [
  "deleted-tasks",
  "deleted-goals",
  "deleted-ideas",
  "deleted-contexts",
  "deleted-categories",
  "deleted-checklists",
];

describe("DeletedPage collapse", () => {
  it("should use unique section keys for all collapsible sections", () => {
    setupMocksAndRender();

    const calledKeys = mockUseSectionCollapse.mock.calls.map((call) => call[0]);

    for (const expectedKey of EXPECTED_SECTION_KEYS) {
      expect(calledKeys).toContain(expectedKey);
    }
  });

  it("should pass distinct keys to each section", () => {
    setupMocksAndRender();

    const calledKeys = mockUseSectionCollapse.mock.calls.map((call) => call[0]);
    const uniqueKeys = new Set(calledKeys);
    // 6 unique section keys expected
    expect(uniqueKeys.size).toBe(EXPECTED_SECTION_KEYS.length);
  });
});
