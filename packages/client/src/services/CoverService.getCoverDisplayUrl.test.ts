import { afterEach, describe, expect, it } from "vitest";
import { getCoverDisplayUrl } from "./CoverService";
import { localCoverCache } from "./LocalCoverCache";

describe("getCoverDisplayUrl", () => {
  afterEach(() => {
    localCoverCache.clear();
  });

  it("should return null for empty fileId", () => {
    expect(getCoverDisplayUrl("")).toBeNull();
  });

  it("should return object URL from cache for hash in cache", () => {
    localCoverCache.set("some-hash", "blob:http://localhost/test");
    const result = getCoverDisplayUrl("some-hash");
    expect(result).toBe("blob:http://localhost/test");
  });

  it("should return null for hash not in cache", () => {
    const result = getCoverDisplayUrl("nonexistent-hash");
    expect(result).toBeNull();
  });

  it("should return cached object URL for remote fileId if present in cache", () => {
    localCoverCache.set(
      "uploaded-remote-id",
      "blob:http://localhost/transferred",
    );
    const result = getCoverDisplayUrl("uploaded-remote-id");
    expect(result).toBe("blob:http://localhost/transferred");
  });
});
