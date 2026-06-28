// Verifies NFR-A1 of add-file-attachments
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Attachment } from "@/types/entities";
import { AttachmentList } from "./AttachmentList";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params?.filename) return `${key}:${params.filename}`;
      return key;
    },
  }),
}));

vi.mock("@/hooks/useFileUrl", () => ({
  useFileUrl: () => ({ url: "blob:test-url" }),
}));

const MOCK_ATTACHMENT_BASE: Omit<Attachment, "id" | "filename"> = {
  entity_type: "goal",
  entity_id: "entity-1",
  data_hash: "abc123",
  mime_type: "image/png",
  file_size: 1024,
  sort_order: "0",
  is_deleted: false,
  created_at: "2026-01-01T00:00:00.000Z" as Attachment["created_at"],
  updated_at: "2026-01-01T00:00:00.000Z" as Attachment["updated_at"],
  revision: 1,
  syncStatus: "synced" as const,
};

function createAttachment(id: string, filename: string): Attachment {
  return {
    ...MOCK_ATTACHMENT_BASE,
    id,
    filename,
  } as Attachment;
}

describe("AttachmentList a11y", () => {
  afterEach(() => {
    cleanup();
  });

  it("should return null for empty attachment list", () => {
    const { container } = render(
      <AttachmentList attachments={[]} onDelete={vi.fn()} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("should render list with aria-label", () => {
    const attachments = [createAttachment("att-1", "photo.png")];

    render(<AttachmentList attachments={attachments} onDelete={vi.fn()} />);

    const list = screen.getByTestId("attachment-list");
    expect(list).toHaveAttribute("aria-label", "Attachments");
    expect(list.tagName).toBe("UL");
  });

  it("should render preview button with aria-label containing filename", () => {
    const attachments = [createAttachment("att-1", "photo.png")];

    render(<AttachmentList attachments={attachments} onDelete={vi.fn()} />);

    const previewButton = screen.getByTestId("attachment-preview-att-1");
    expect(previewButton).toHaveAttribute(
      "aria-label",
      "attachment.list.preview:photo.png",
    );
  });

  it("should render download button with aria-label containing filename", () => {
    const attachments = [createAttachment("att-1", "report.pdf")];

    render(<AttachmentList attachments={attachments} onDelete={vi.fn()} />);

    const downloadButton = screen.getByTestId("attachment-download-att-1");
    expect(downloadButton).toHaveAttribute(
      "aria-label",
      "attachment.list.download:report.pdf",
    );
  });

  it("should render delete button with aria-label containing filename", () => {
    const attachments = [createAttachment("att-1", "draft.txt")];

    render(<AttachmentList attachments={attachments} onDelete={vi.fn()} />);

    const deleteButton = screen.getByTestId("attachment-delete-att-1");
    expect(deleteButton).toHaveAttribute(
      "aria-label",
      "attachment.list.delete:draft.txt",
    );
  });

  it("should not render delete button in read-only mode", () => {
    const attachments = [createAttachment("att-1", "photo.png")];

    render(
      <AttachmentList
        attachments={attachments}
        onDelete={vi.fn()}
        isReadOnly={true}
      />,
    );

    expect(
      screen.queryByTestId("attachment-delete-att-1"),
    ).not.toBeInTheDocument();
  });
});
