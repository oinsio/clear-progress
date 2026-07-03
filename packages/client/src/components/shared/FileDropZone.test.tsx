/**
 * Verifies FR1, FR2, FR3, FR6, FR7, FR8, NFR-A1, NFR-R1, UX1-UX5
 * of attachment-drag-and-drop.
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FileValidationResult } from "@/utils/validateFile";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

const mockValidateFile = vi.fn<(file: File) => Promise<FileValidationResult>>();

vi.mock("@/utils/validateFile", () => ({
  validateFile: (...args: unknown[]) => mockValidateFile(args[0] as File),
}));

// jsdom does not implement File.prototype.arrayBuffer — add polyfill for tests
const EMPTY_BUFFER = new ArrayBuffer(0);
if (!File.prototype.arrayBuffer) {
  Object.defineProperty(File.prototype, "arrayBuffer", {
    value() {
      return Promise.resolve(EMPTY_BUFFER);
    },
    configurable: true,
    writable: true,
  });
}

// Static import — vi.mock hoists above this automatically
import { FileDropZone } from "./FileDropZone";

function createDragEvent(files: File[] = [], types: string[] = ["Files"]) {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      types,
      files,
    },
  };
}

function createValidFile(name = "photo.jpg"): File {
  return new File(["content"], name, { type: "image/jpeg" });
}

function createInvalidFile(name = "malware.exe"): File {
  return new File(["content"], name, { type: "application/octet-stream" });
}

describe("FileDropZone", () => {
  let onFilesAccepted: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFilesAccepted = vi.fn();
    mockValidateFile.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  // FR1: renders children normally
  it("should render children content", () => {
    render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p data-testid="child-content">Task details</p>
      </FileDropZone>,
    );

    expect(screen.getByTestId("child-content")).toHaveTextContent(
      "Task details",
    );
  });

  // FR2, UX1: shows overlay on file drag enter
  it("should show overlay when files are dragged over", () => {
    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    fireEvent.dragEnter(dropZone, createDragEvent());

    expect(screen.getByTestId("file-drop-overlay")).toBeInTheDocument();
  });

  // FR3: does NOT show overlay for non-file drag
  it("should not show overlay for non-file drag items", () => {
    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    fireEvent.dragEnter(dropZone, createDragEvent([], ["text/plain"]));

    expect(screen.queryByTestId("file-drop-overlay")).not.toBeInTheDocument();
  });

  // UX2: hides overlay on drag leave
  it("should hide overlay when files are dragged away", () => {
    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    fireEvent.dragEnter(dropZone, createDragEvent());
    expect(screen.getByTestId("file-drop-overlay")).toBeInTheDocument();

    fireEvent.dragLeave(dropZone, createDragEvent());
    expect(screen.queryByTestId("file-drop-overlay")).not.toBeInTheDocument();
  });

  // UX3: hides overlay after drop
  it("should hide overlay after files are dropped", async () => {
    mockValidateFile.mockResolvedValue({
      valid: true,
      file: createValidFile(),
    });

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    fireEvent.dragEnter(dropZone, createDragEvent());
    expect(screen.getByTestId("file-drop-overlay")).toBeInTheDocument();

    const validFile = createValidFile();
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([validFile]));
    });

    expect(screen.queryByTestId("file-drop-overlay")).not.toBeInTheDocument();
  });

  // FR6, FR7: calls onFilesAccepted with valid files
  it("should call onFilesAccepted with valid files on drop", async () => {
    const validFile = createValidFile("photo.jpg");
    mockValidateFile.mockResolvedValue({
      valid: true,
      file: validFile,
    });

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([validFile]));
    });

    expect(onFilesAccepted).toHaveBeenCalledWith([validFile]);
  });

  // FR8, UX4: shows rejection message for invalid files
  it("should show rejection message for invalid files", async () => {
    const invalidFile = createInvalidFile("malware.exe");
    mockValidateFile.mockResolvedValue({
      valid: false,
      filename: "malware.exe",
      errorKey: "attachment.attach.errorType",
    });

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([invalidFile]));
    });

    await waitFor(() => {
      const errorElement = screen.getByTestId("file-drop-error");
      expect(errorElement).toHaveTextContent("malware.exe");
    });
  });

  // FR6, FR8: accepts valid AND shows rejected filenames in mixed drop
  it("should accept valid files and show rejected filenames in mixed drop", async () => {
    const validFile = createValidFile("photo.jpg");
    const invalidFile = createInvalidFile("malware.exe");

    mockValidateFile
      .mockResolvedValueOnce({ valid: true, file: validFile })
      .mockResolvedValueOnce({
        valid: false,
        filename: "malware.exe",
        errorKey: "attachment.attach.errorType",
      });

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([validFile, invalidFile]));
    });

    await waitFor(() => {
      expect(onFilesAccepted).toHaveBeenCalledWith([validFile]);
      const errorElement = screen.getByTestId("file-drop-error");
      expect(errorElement).toHaveTextContent("malware.exe");
    });
  });

  // NFR-A1: error message has role alert
  it("should render error message with role alert for accessibility", async () => {
    const invalidFile = createInvalidFile("bad.exe");
    mockValidateFile.mockResolvedValue({
      valid: false,
      filename: "bad.exe",
      errorKey: "attachment.attach.errorType",
    });

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([invalidFile]));
    });

    await waitFor(() => {
      const errorElement = screen.getByTestId("file-drop-error");
      expect(errorElement).toHaveAttribute("role", "alert");
    });
  });

  // UX5: error auto-dismisses after 5 seconds
  it("should auto-dismiss error after ERROR_DISPLAY_DURATION_MS", async () => {
    vi.useFakeTimers();

    const invalidFile = createInvalidFile("bad.exe");
    mockValidateFile.mockImplementation(() =>
      Promise.resolve({
        valid: false as const,
        filename: "bad.exe",
        errorKey: "attachment.attach.errorType",
      }),
    );

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([invalidFile]));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByTestId("file-drop-error")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByTestId("file-drop-error")).not.toBeInTheDocument();

    vi.useRealTimers();
  }, 10000);

  // FR8: does not call onFilesAccepted when all files rejected
  it("should not call onFilesAccepted when all files are rejected", async () => {
    const invalidFile1 = createInvalidFile("bad1.exe");
    const invalidFile2 = createInvalidFile("bad2.exe");

    mockValidateFile
      .mockResolvedValueOnce({
        valid: false,
        filename: "bad1.exe",
        errorKey: "attachment.attach.errorType",
      })
      .mockResolvedValueOnce({
        valid: false,
        filename: "bad2.exe",
        errorKey: "attachment.attach.errorType",
      });

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([invalidFile1, invalidFile2]));
    });

    expect(onFilesAccepted).not.toHaveBeenCalled();
  });

  // FR2: overlay shows hint text
  it("should display drop hint text in overlay", () => {
    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    fireEvent.dragEnter(dropZone, createDragEvent());

    const overlay = screen.getByTestId("file-drop-overlay");
    expect(overlay).toHaveTextContent("attachment.dropZone.hint");
  });

  // FR2: dragover handler is attached (required for drop to work)
  it("should handle drag over without errors", () => {
    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;

    expect(() => {
      fireEvent.dragOver(dropZone, createDragEvent());
    }).not.toThrow();
  });

  // FR2: nested element drag counter — overlay stays when entering child elements
  it("should keep overlay visible during nested element drag enter/leave", () => {
    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <div data-testid="child-element">
          <span>Nested content</span>
        </div>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    const childElement = screen.getByTestId("child-element");

    // Enter the drop zone
    fireEvent.dragEnter(dropZone, createDragEvent());
    expect(screen.getByTestId("file-drop-overlay")).toBeInTheDocument();

    // Enter a child element (fires another dragenter)
    fireEvent.dragEnter(childElement, createDragEvent());
    // Leave the parent (fires dragleave for parent)
    fireEvent.dragLeave(dropZone, createDragEvent());

    // Overlay should still be visible
    expect(screen.getByTestId("file-drop-overlay")).toBeInTheDocument();

    // Leave the child element (counter reaches 0)
    fireEvent.dragLeave(childElement, createDragEvent());
    expect(screen.queryByTestId("file-drop-overlay")).not.toBeInTheDocument();
  });

  // Initial state: no error message shown
  it("should not show error message in initial state", () => {
    render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    expect(screen.queryByTestId("file-drop-error")).not.toBeInTheDocument();
  });

  // Timer cleanup: second drop replaces previous error timer
  it("should clear previous error timer when new files are dropped", async () => {
    vi.useFakeTimers();

    mockValidateFile.mockImplementation(() =>
      Promise.resolve({
        valid: false as const,
        filename: "first.exe",
        errorKey: "attachment.attach.errorType",
      }),
    );

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;

    // First drop
    await act(async () => {
      fireEvent.drop(
        dropZone,
        createDragEvent([createInvalidFile("first.exe")]),
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByTestId("file-drop-error")).toBeInTheDocument();

    // Advance 3 seconds (before first timer fires)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Second drop — should reset the timer
    mockValidateFile.mockImplementation(() =>
      Promise.resolve({
        valid: false as const,
        filename: "second.exe",
        errorKey: "attachment.attach.errorType",
      }),
    );

    await act(async () => {
      fireEvent.drop(
        dropZone,
        createDragEvent([createInvalidFile("second.exe")]),
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    // After 3 more seconds (6 total from first drop), error should still be visible
    // because second timer reset it
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("file-drop-error")).toBeInTheDocument();

    // After 5 seconds from second drop, it should dismiss
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId("file-drop-error")).not.toBeInTheDocument();

    vi.useRealTimers();
  }, 10000);

  // Rejection message uses correct i18n key with filenames
  it("should use attachment.dropZone.rejected i18n key with filenames joined by comma", async () => {
    const invalidFile1 = createInvalidFile("bad1.exe");
    const invalidFile2 = createInvalidFile("bad2.zip");

    mockValidateFile
      .mockResolvedValueOnce({
        valid: false,
        filename: "bad1.exe",
        errorKey: "attachment.attach.errorType",
      })
      .mockResolvedValueOnce({
        valid: false,
        filename: "bad2.zip",
        errorKey: "attachment.attach.errorType",
      });

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([invalidFile1, invalidFile2]));
    });

    await waitFor(() => {
      const errorElement = screen.getByTestId("file-drop-error");
      // t mock returns: key:{"filenames":"bad1.exe, bad2.zip"}
      expect(errorElement.textContent).toContain(
        "attachment.dropZone.rejected",
      );
      expect(errorElement.textContent).toContain("bad1.exe, bad2.zip");
    });
  });

  // When only rejected files: rejection message shown but no callback
  it("should show rejection message with correct filenames and not accept any", async () => {
    const invalidFile = createInvalidFile("archive.zip");

    mockValidateFile.mockResolvedValue({
      valid: false,
      filename: "archive.zip",
      errorKey: "attachment.attach.errorType",
    });

    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([invalidFile]));
    });

    await waitFor(() => {
      expect(screen.getByTestId("file-drop-error")).toBeInTheDocument();
    });
    expect(onFilesAccepted).not.toHaveBeenCalled();
  });

  // FR6: does not call onFilesAccepted for empty file list
  it("should not call onFilesAccepted when no files are dropped", async () => {
    const { container } = render(
      <FileDropZone onFilesAccepted={onFilesAccepted}>
        <p>Content</p>
      </FileDropZone>,
    );

    const dropZone = container.firstElementChild!;
    await act(async () => {
      fireEvent.drop(dropZone, createDragEvent([]));
    });

    expect(onFilesAccepted).not.toHaveBeenCalled();
    expect(mockValidateFile).not.toHaveBeenCalled();
  });
});
