import { describe, expect, it } from "vitest";
import { parseSupabaseInput } from "./supabaseUrl";

const PROJECT_ID = "xxxxx";
const FULL_URL = "https://xxxxx.supabase.co";
const CUSTOM_URL = "https://my-instance.example.com";

describe("parseSupabaseInput", () => {
  it("should resolve plain project ID to full Supabase URL", () => {
    expect(parseSupabaseInput(PROJECT_ID)).toBe("https://xxxxx.supabase.co");
  });

  it("should pass through full URL unchanged", () => {
    expect(parseSupabaseInput(FULL_URL)).toBe(FULL_URL);
  });

  it("should pass through custom domain URL unchanged", () => {
    expect(parseSupabaseInput(CUSTOM_URL)).toBe(CUSTOM_URL);
  });

  it("should trim leading whitespace before processing", () => {
    expect(parseSupabaseInput(`  ${PROJECT_ID}`)).toBe(FULL_URL);
  });

  it("should trim trailing whitespace before processing", () => {
    expect(parseSupabaseInput(`${PROJECT_ID}  `)).toBe(FULL_URL);
  });

  it("should trim whitespace from full URL", () => {
    expect(parseSupabaseInput(`  ${FULL_URL}  `)).toBe(FULL_URL);
  });

  it("should pass through http:// URL unchanged (local dev)", () => {
    const localUrl = "http://localhost:54321";
    expect(parseSupabaseInput(localUrl)).toBe(localUrl);
  });
});
