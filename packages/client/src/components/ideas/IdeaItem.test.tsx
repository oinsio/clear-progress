import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IdeaItem } from "./IdeaItem";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
vi.mock("@/hooks/useIsUnsynced");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/useAttachmentCount", () => ({
  useAttachmentCount: vi.fn().mockReturnValue({
    attachmentCount: 0,
    hasUnsyncedAttachments: false,
    isLoading: false,
  }),
}));

import { useAttachmentCount } from "@/hooks/useAttachmentCount";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelSide } from "@/hooks/usePanelSide";

const mockUseIsUnsynced = vi.mocked(useIsUnsynced);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUseAttachmentCount = vi.mocked(useAttachmentCount);

const createIdea = (overrides = {}) => ({
  id: "test-id",
  name: "Test Idea",
  description: "",
  is_deleted: false,
  version: 1,
  sort_order: "0",
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
  revision: 1,
  needsSync: false,
  ...overrides,
});

describe("IdeaItem", () => {
  beforeEach(() => {
    mockUseIsUnsynced.mockReturnValue(false);
    mockUsePanelSide.mockReturnValue({
      panelSide: "right",
      setPanelSide: vi.fn(),
    });
  });

  // implements FR3 of fix-nonsync-indication-for-attachments
  it("should show amber stripe when hasUnsyncedAttachments is true", () => {
    mockUseAttachmentCount.mockReturnValue({
      attachmentCount: 1,
      hasUnsyncedAttachments: true,
      isLoading: false,
    });
    const idea = createIdea();
    render(<IdeaItem idea={idea} />);

    const ideaItem = screen.getByTestId("idea-item");
    expect(ideaItem).toHaveClass("border-l-amber-400");
  });

  // implements FR3 of fix-newline-display
  it("should have whitespace-pre-line class on description to preserve newlines", () => {
    const idea = createIdea({ description: "Line 1\nLine 2" });
    render(<IdeaItem idea={idea} />);

    const description = screen.getByText("Line 1\nLine 2", {
      normalizer: (text) => text,
    });
    expect(description).toHaveClass("whitespace-pre-line");
  });
});
