import { GasSyncAdapter } from "@clear-progress/adapter-gas";
import { createAdapter } from "@clear-progress/contract";
import { describe, expect, it } from "vitest";
import "@clear-progress/adapter-loader";

describe("adapter-loader", () => {
  it("should register gas adapter on import", () => {
    const adapter = createAdapter("gas", "https://example.com", () => null);

    expect(adapter).toBeInstanceOf(GasSyncAdapter);
  });
});
