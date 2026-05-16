import { describe, expect, it } from "vitest";
import { createGasAdapter, GasSyncAdapter } from "../src/client";

describe("createGasAdapter", () => {
  it("should return a GasSyncAdapter instance", () => {
    const adapter = createGasAdapter("https://example.com/exec", () => "token");

    expect(adapter).toBeInstanceOf(GasSyncAdapter);
  });

  it("should create adapter with provided url and getAccessToken", async () => {
    const adapter = createGasAdapter("https://example.com/exec", () => null);

    // Adapter should throw ApiAuthError when token is null
    await expect(adapter.init()).rejects.toThrow("Authentication required");
  });
});
