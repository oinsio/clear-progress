import { GasSyncAdapter } from "@clear-progress/adapter-gas";
import { createAdapter } from "@clear-progress/contract";
import { describe, expect, it } from "vitest";
import { loadAdapters } from "../src";

describe("loadAdapters", () => {
  it("should register gas adapter", () => {
    loadAdapters();

    const adapter = createAdapter("gas", "https://example.com", () => null);

    expect(adapter).toBeInstanceOf(GasSyncAdapter);
  });
});
