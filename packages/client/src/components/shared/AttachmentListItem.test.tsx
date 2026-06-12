import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildAttachment } from "@/test/factories/attachmentFactory";
import { AttachmentListItem } from "./AttachmentListItem";

vi.mock("@/hooks/useFileUrl", () => ({
  useFileUrl: () => ({ url: "blob:test", isLoading: false }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const stableOnDelete = vi.fn();
const stableOnPreview = vi.fn();

function renderItem(
  overrides: Partial<Parameters<typeof buildAttachment>[0]> = {},
) {
  const attachment = buildAttachment(overrides);
  render(
    <AttachmentListItem
      attachment={attachment}
      onDelete={stableOnDelete}
      onPreview={stableOnPreview}
    />,
  );
  return attachment;
}

// FR12, FR13, UX5 of task-detail-page-ui-improvements
describe("AttachmentListItem sync indicator", () => {
  // FR12
  it("should show amber stripe when attachment needsSync is true", () => {
    const attachment = renderItem({ needsSync: true });
    const listItem = screen.getByTestId(`attachment-item-${attachment.id}`);
    expect(listItem.className).toContain("border-l-amber-400");
    expect(listItem.className).toContain("border-l-2");
  });

  // FR13
  it("should show transparent stripe when attachment needsSync is false", () => {
    const attachment = renderItem({ needsSync: false });
    const listItem = screen.getByTestId(`attachment-item-${attachment.id}`);
    expect(listItem.className).toContain("border-l-transparent");
    expect(listItem.className).toContain("border-l-2");
  });
});
