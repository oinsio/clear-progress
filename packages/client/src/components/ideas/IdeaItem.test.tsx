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
vi.mock("@/components/ui/DescriptionMarkdown", () => ({
  DescriptionMarkdown: ({
    text,
    className,
  }: {
    text: string;
    className?: string;
  }) => (
    <div data-testid="description-markdown" data-classname={className}>
      {text}
    </div>
  ),
}));
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

  // implements FR1 of markdown-in-descriptions
  it("should render description via DescriptionMarkdown", () => {
    const idea = createIdea({ description: "**bold text**" });
    render(<IdeaItem idea={idea} />);

    const markdownElement = screen.getByTestId("description-markdown");
    expect(markdownElement).toBeInTheDocument();
    expect(markdownElement).toHaveTextContent("**bold text**");
  });

  // implements FR1 of markdown-in-descriptions
  it("should not render DescriptionMarkdown when description is empty", () => {
    const idea = createIdea({ description: "" });
    render(<IdeaItem idea={idea} />);

    expect(
      screen.queryByTestId("description-markdown"),
    ).not.toBeInTheDocument();
  });
});
