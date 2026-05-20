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

  it("should return object URL from cache for local:* fileId", () => {
    localCoverCache.set("some-local-id", "blob:http://localhost/test");
    const result = getCoverDisplayUrl("local:some-local-id");
    expect(result).toBe("blob:http://localhost/test");
  });

  it("should return null for local:* fileId not in cache", () => {
    const result = getCoverDisplayUrl("local:nonexistent-id");
    expect(result).toBeNull();
  });

  it("should return null for regular remote fileId not in cache", () => {
    const result = getCoverDisplayUrl("remote-file-id");
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
