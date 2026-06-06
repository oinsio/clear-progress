import { afterEach, describe, expect, it } from "vitest";
import { getFileDisplayUrl } from "./FileService";
import { localFileCache } from "./LocalFileCache";

describe("getFileDisplayUrl", () => {
  afterEach(() => {
    localFileCache.clear();
  });

  it("should return null for empty fileId", () => {
    expect(getFileDisplayUrl("")).toBeNull();
  });

  it("should return object URL from cache for hash in cache", () => {
    localFileCache.set("some-hash", "blob:http://localhost/test");
    const result = getFileDisplayUrl("some-hash");
    expect(result).toBe("blob:http://localhost/test");
  });

  it("should return null for hash not in cache", () => {
    const result = getFileDisplayUrl("nonexistent-hash");
    expect(result).toBeNull();
  });

  it("should return cached object URL for remote fileId if present in cache", () => {
    localFileCache.set(
      "uploaded-remote-id",
      "blob:http://localhost/transferred",
    );
    const result = getFileDisplayUrl("uploaded-remote-id");
    expect(result).toBe("blob:http://localhost/transferred");
  });
});
