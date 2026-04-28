import { describe, expect, it } from "vitest";
import { extractLinks, shortenUrl } from "./linkify";

describe("extractLinks", () => {
  it("should return single text segment when no URLs present", () => {
    const result = extractLinks("Just plain text without links");
    expect(result).toEqual([
      { type: "text", value: "Just plain text without links" },
    ]);
  });

  it("should extract single URL from text", () => {
    const result = extractLinks("Check https://example.com for details");
    expect(result).toEqual([
      { type: "text", value: "Check " },
      { type: "url", value: "https://example.com" },
      { type: "text", value: " for details" },
    ]);
  });

  it("should extract multiple URLs from text", () => {
    const result = extractLinks(
      "Visit https://example.com and https://test.org",
    );
    expect(result).toEqual([
      { type: "text", value: "Visit " },
      { type: "url", value: "https://example.com" },
      { type: "text", value: " and " },
      { type: "url", value: "https://test.org" },
    ]);
  });

  it("should handle URL with query parameters", () => {
    const result = extractLinks(
      "Translate https://translate.google.com/?hl=ru&sl=en here",
    );
    expect(result).toEqual([
      { type: "text", value: "Translate " },
      { type: "url", value: "https://translate.google.com/?hl=ru&sl=en" },
      { type: "text", value: " here" },
    ]);
  });

  it("should handle URL with coordinates in path", () => {
    const result = extractLinks(
      "Map https://maps.google.com/@37.7749,-122.4194,15z location",
    );
    expect(result).toEqual([
      { type: "text", value: "Map " },
      { type: "url", value: "https://maps.google.com/@37.7749,-122.4194,15z" },
      { type: "text", value: " location" },
    ]);
  });

  it("should strip trailing punctuation from URL", () => {
    const result = extractLinks(
      "See https://example.com. Also https://test.org, and https://foo.bar)",
    );
    expect(result).toEqual([
      { type: "text", value: "See " },
      { type: "url", value: "https://example.com" },
      { type: "text", value: ". Also " },
      { type: "url", value: "https://test.org" },
      { type: "text", value: ", and " },
      { type: "url", value: "https://foo.bar" },
      { type: "text", value: ")" },
    ]);
  });

  it("should handle URL in middle of text", () => {
    const result = extractLinks("Before https://example.com after");
    expect(result).toEqual([
      { type: "text", value: "Before " },
      { type: "url", value: "https://example.com" },
      { type: "text", value: " after" },
    ]);
  });

  it("should return empty array for empty string", () => {
    const result = extractLinks("");
    expect(result).toEqual([]);
  });

  it("should handle URL at start of text", () => {
    const result = extractLinks("https://example.com is the link");
    expect(result).toEqual([
      { type: "url", value: "https://example.com" },
      { type: "text", value: " is the link" },
    ]);
  });

  it("should handle URL at end of text", () => {
    const result = extractLinks("The link is https://example.com");
    expect(result).toEqual([
      { type: "text", value: "The link is " },
      { type: "url", value: "https://example.com" },
    ]);
  });

  it("should handle http protocol", () => {
    const result = extractLinks("Visit http://example.com");
    expect(result).toEqual([
      { type: "text", value: "Visit " },
      { type: "url", value: "http://example.com" },
    ]);
  });
});

describe("shortenUrl", () => {
  it("should remove www prefix from hostname", () => {
    const result = shortenUrl("https://www.example.com/path");
    expect(result).toBe("example.com/path");
  });

  it("should remove trailing slash from path", () => {
    const result = shortenUrl("https://example.com/path/");
    expect(result).toBe("example.com/path");
  });

  it("should shorten path with more than 2 segments", () => {
    const result = shortenUrl("https://example.com/first/middle/last");
    expect(result).toBe("example.com/first/…/last");
  });

  it("should keep path with 2 segments as is", () => {
    const result = shortenUrl("https://example.com/first/second");
    expect(result).toBe("example.com/first/second");
  });

  it("should keep path with 1 segment as is", () => {
    const result = shortenUrl("https://example.com/path");
    expect(result).toBe("example.com/path");
  });

  it("should omit query parameters", () => {
    const result = shortenUrl("https://example.com/path?foo=bar&baz=qux");
    expect(result).toBe("example.com/path");
  });

  it("should handle URL without path", () => {
    const result = shortenUrl("https://example.com");
    expect(result).toBe("example.com");
  });

  it("should handle URL with only hostname and trailing slash", () => {
    const result = shortenUrl("https://example.com/");
    expect(result).toBe("example.com");
  });

  it("should fallback to removing protocol if URL parsing fails", () => {
    const result = shortenUrl("not-a-valid-url");
    expect(result).toBe("not-a-valid-url");
  });

  it("should handle URL with hash", () => {
    const result = shortenUrl("https://example.com/path#section");
    expect(result).toBe("example.com/path");
  });

  it("should handle complex path with query and hash", () => {
    const result = shortenUrl(
      "https://www.example.com/a/b/c/d?foo=bar#section",
    );
    expect(result).toBe("example.com/a/…/d");
  });
});
