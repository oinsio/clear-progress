import { describe, expect, it } from "vitest";
import { detectMimeType } from "./detectMimeType";

// implements FR1 of fix-file-mime-detection

function createBuffer(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];
const RIFF_HEADER = [0x52, 0x49, 0x46, 0x46];
const FILE_SIZE_PLACEHOLDER = [0x00, 0x00, 0x00, 0x00];

describe("detectMimeType", () => {
  it("should return 'image/jpeg' for buffer starting with FF D8 FF", () => {
    const buffer = createBuffer(0xff, 0xd8, 0xff, 0xe0, 0x00);

    expect(detectMimeType(buffer)).toBe("image/jpeg");
  });

  it("should return 'image/png' for buffer starting with 89 50 4E 47", () => {
    const buffer = createBuffer(0x89, 0x50, 0x4e, 0x47, 0x0d);

    expect(detectMimeType(buffer)).toBe("image/png");
  });

  it("should return 'image/webp' for RIFF header with WEBP marker at offset 8", () => {
    const buffer = createBuffer(
      ...RIFF_HEADER,
      ...FILE_SIZE_PLACEHOLDER,
      ...WEBP_MARKER,
      0x00,
    );

    expect(detectMimeType(buffer)).toBe("image/webp");
  });

  it("should return 'image/gif' for buffer starting with 47 49 46 38", () => {
    const buffer = createBuffer(0x47, 0x49, 0x46, 0x38, 0x39);

    expect(detectMimeType(buffer)).toBe("image/gif");
  });

  it("should return 'application/pdf' for buffer starting with 25 50 44 46", () => {
    const buffer = createBuffer(0x25, 0x50, 0x44, 0x46, 0x2d);

    expect(detectMimeType(buffer)).toBe("application/pdf");
  });

  it("should return null for RIFF header without WEBP marker (e.g. WAVE)", () => {
    const waveMarker = [0x57, 0x41, 0x56, 0x45]; // WAVE
    const buffer = createBuffer(
      ...RIFF_HEADER,
      ...FILE_SIZE_PLACEHOLDER,
      ...waveMarker,
      0x00,
    );

    expect(detectMimeType(buffer)).toBeNull();
  });

  it("should return null for unknown binary content", () => {
    const buffer = createBuffer(0x00, 0x01, 0x02, 0x03, 0x04);

    expect(detectMimeType(buffer)).toBeNull();
  });

  it("should return null for empty buffer", () => {
    const buffer = createBuffer();

    expect(detectMimeType(buffer)).toBeNull();
  });

  it("should return null for buffer shorter than shortest signature", () => {
    const buffer = createBuffer(0xff, 0xd8);

    expect(detectMimeType(buffer)).toBeNull();
  });
});
