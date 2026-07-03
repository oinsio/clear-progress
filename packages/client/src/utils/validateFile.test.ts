import { MAX_ATTACHMENT_SIZE_BYTES } from "@clear-progress/contract";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FileValidationResult } from "./validateFile";

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

const { detectMimeType } = vi.hoisted(() => ({
  detectMimeType: vi.fn<(buffer: ArrayBuffer) => string | null>(),
}));

vi.mock("@clear-progress/contract", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@clear-progress/contract")>();
  return { ...original, detectMimeType };
});

const VALID_FILE_SIZE = 1024;
const OVERSIZED_FILE_SIZE = MAX_ATTACHMENT_SIZE_BYTES + 1;

function createFile(
  name: string,
  type: string,
  size: number = VALID_FILE_SIZE,
): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe("validateFile", () => {
  let validateFile: (file: File) => Promise<FileValidationResult>;

  beforeEach(async () => {
    vi.resetModules();
    detectMimeType.mockReset();
    const module = await import("./validateFile");
    validateFile = module.validateFile;
  });

  it("should return valid result for file with detected MIME type (JPEG)", async () => {
    detectMimeType.mockReturnValue("image/jpeg");
    const file = createFile("photo.jpg", "image/jpeg");

    const validationResult = await validateFile(file);

    expect(validationResult).toEqual({ valid: true, file });
  });

  it("should return valid result for text/plain file without magic bytes", async () => {
    detectMimeType.mockReturnValue(null);
    const file = createFile("readme.txt", "text/plain");

    const validationResult = await validateFile(file);

    expect(validationResult).toEqual({ valid: true, file });
  });

  it("should return valid result for text/markdown file without magic bytes", async () => {
    detectMimeType.mockReturnValue(null);
    const file = createFile("notes.md", "text/markdown");

    const validationResult = await validateFile(file);

    expect(validationResult).toEqual({ valid: true, file });
  });

  it("should return errorUnrecognized when detectMimeType returns null and browser type is not text", async () => {
    detectMimeType.mockReturnValue(null);
    const file = createFile("mystery.bin", "application/octet-stream");

    const validationResult = await validateFile(file);

    expect(validationResult).toEqual({
      valid: false,
      filename: "mystery.bin",
      errorKey: "attachment.attach.errorUnrecognized",
    });
  });

  it("should return errorType when detected MIME type is not in allowlist", async () => {
    detectMimeType.mockReturnValue("application/zip");
    const file = createFile("archive.zip", "application/zip");

    const validationResult = await validateFile(file);

    expect(validationResult).toEqual({
      valid: false,
      filename: "archive.zip",
      errorKey: "attachment.attach.errorType",
    });
  });

  it("should return errorSize when file exceeds max attachment size", async () => {
    detectMimeType.mockReturnValue("image/jpeg");
    const file = createFile("large.jpg", "image/jpeg", OVERSIZED_FILE_SIZE);

    const validationResult = await validateFile(file);

    expect(validationResult).toEqual({
      valid: false,
      filename: "large.jpg",
      errorKey: "attachment.attach.errorSize",
    });
  });

  it("should accept file at exactly max attachment size", async () => {
    detectMimeType.mockReturnValue("image/png");
    const file = createFile(
      "exact.png",
      "image/png",
      MAX_ATTACHMENT_SIZE_BYTES,
    );

    const validationResult = await validateFile(file);

    expect(validationResult).toEqual({ valid: true, file });
  });
});
