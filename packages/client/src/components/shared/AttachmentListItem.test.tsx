import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

let stableOnDelete: ReturnType<typeof vi.fn>;
let stableOnPreview: ReturnType<typeof vi.fn>;

beforeEach(() => {
  stableOnDelete = vi.fn();
  stableOnPreview = vi.fn();
});

function renderItem(
  overrides: Partial<Parameters<typeof buildAttachment>[0]> = {},
  props: { isReadOnly?: boolean } = {},
) {
  const attachment = buildAttachment(overrides);
  render(
    <AttachmentListItem
      attachment={attachment}
      onDelete={stableOnDelete}
      onPreview={stableOnPreview}
      {...props}
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

describe("AttachmentListItem file type icon", () => {
  it("should render ImageIcon for image mime types", () => {
    renderItem({ mime_type: "image/png" });
    expect(screen.getByTestId(/attachment-item/)).toBeDefined();
    const svgIcons = document.querySelectorAll("svg");
    const iconNames = Array.from(svgIcons).map((svg) =>
      svg.classList.toString(),
    );
    expect(iconNames.some((name) => name.includes("lucide-image"))).toBe(true);
  });

  it("should render FileText icon for PDF mime type", () => {
    renderItem({ mime_type: "application/pdf" });
    const svgIcons = document.querySelectorAll("svg");
    const iconNames = Array.from(svgIcons).map((svg) =>
      svg.classList.toString(),
    );
    expect(iconNames.some((name) => name.includes("lucide-file-text"))).toBe(
      true,
    );
  });

  it("should render FileText icon for text mime types", () => {
    renderItem({ mime_type: "text/plain" });
    const svgIcons = document.querySelectorAll("svg");
    const iconNames = Array.from(svgIcons).map((svg) =>
      svg.classList.toString(),
    );
    expect(iconNames.some((name) => name.includes("lucide-file-text"))).toBe(
      true,
    );
  });

  it("should render generic File icon for unknown mime types", () => {
    renderItem({ mime_type: "application/zip" });
    const svgIcons = document.querySelectorAll("svg");
    const iconNames = Array.from(svgIcons).map((svg) =>
      svg.classList.toString(),
    );
    expect(iconNames.some((name) => name.includes("lucide-file"))).toBe(true);
    expect(iconNames.some((name) => name.includes("lucide-file-text"))).toBe(
      false,
    );
    expect(iconNames.some((name) => name.includes("lucide-image"))).toBe(false);
  });
});

describe("AttachmentListItem file size display", () => {
  it("should display bytes for small files", () => {
    renderItem({ file_size: 500 });
    expect(screen.getByText("500 B")).toBeDefined();
  });

  it("should display KB for medium files", () => {
    renderItem({ file_size: 2048 });
    expect(screen.getByText("2.0 KB")).toBeDefined();
  });

  it("should display MB for large files", () => {
    renderItem({ file_size: 1048576 });
    expect(screen.getByText("1.0 MB")).toBeDefined();
  });

  it("should display MB for files larger than 1MB", () => {
    renderItem({ file_size: 5242880 });
    expect(screen.getByText("5.0 MB")).toBeDefined();
  });
});

describe("AttachmentListItem isReadOnly", () => {
  it("should show delete button by default", () => {
    const attachment = renderItem();
    expect(
      screen.getByTestId(`attachment-delete-${attachment.id}`),
    ).toBeDefined();
  });

  it("should hide delete button when isReadOnly is true", () => {
    const attachment = renderItem({}, { isReadOnly: true });
    expect(
      screen.queryByTestId(`attachment-delete-${attachment.id}`),
    ).toBeNull();
  });
});
