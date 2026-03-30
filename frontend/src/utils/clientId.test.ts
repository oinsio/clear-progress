import { describe, it, expect } from "vitest";
import { parseClientId } from "./clientId";

const FULL_CLIENT_ID = "306298988178-18tatr5tsrlik7kvlcc9rgo6t6lp76ep.apps.googleusercontent.com";
const SHORT_CLIENT_ID = "306298988178-18tatr5tsrlik7kvlcc9rgo6t6lp76ep";

describe("parseClientId", () => {
  it("should return full client ID as-is when it already has the suffix", () => {
    expect(parseClientId(FULL_CLIENT_ID)).toBe(FULL_CLIENT_ID);
  });

  it("should append suffix to short form client ID", () => {
    expect(parseClientId(SHORT_CLIENT_ID)).toBe(FULL_CLIENT_ID);
  });

  it("should trim whitespace before processing (full form)", () => {
    expect(parseClientId(`  ${FULL_CLIENT_ID}  `)).toBe(FULL_CLIENT_ID);
  });

  it("should trim whitespace before processing (short form)", () => {
    expect(parseClientId(`  ${SHORT_CLIENT_ID}  `)).toBe(FULL_CLIENT_ID);
  });
});
