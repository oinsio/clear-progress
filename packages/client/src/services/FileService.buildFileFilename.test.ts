import { describe, expect, it } from "vitest";
import { buildFileFilename } from "./FileService";

describe("buildFileFilename", () => {
  it("should use first 12 chars of hash and jpeg → jpg extension", () => {
    expect(buildFileFilename("abcdef012345678901", "image/jpeg")).toBe(
      "abcdef012345.jpg",
    );
  });

  it("should preserve png extension", () => {
    expect(buildFileFilename("abcdef012345678901", "image/png")).toBe(
      "abcdef012345.png",
    );
  });

  it("should preserve webp extension", () => {
    expect(buildFileFilename("abcdef012345678901", "image/webp")).toBe(
      "abcdef012345.webp",
    );
  });

  it("should fall back to jpg when mime subtype is empty", () => {
    expect(buildFileFilename("abcdef012345678901", "image/")).toBe(
      "abcdef012345.jpg",
    );
  });

  it("should fall back to jpg when mime type is unrecognizable", () => {
    expect(buildFileFilename("abcdef012345678901", "")).toBe(
      "abcdef012345.jpg",
    );
  });
});
