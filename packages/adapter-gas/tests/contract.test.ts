import { syncAdapterContract } from "@clear-progress/contract/contracts";
import { describe, it } from "vitest";
import { GasSyncAdapter } from "../src/client";

// These tests require a real GAS endpoint and token
// Run only when environment variables are present
const gasUrl = process.env.TEST_GAS_URL;
const testToken = process.env.TEST_TOKEN;
if (gasUrl && testToken) {
  syncAdapterContract(async () => {
    return new GasSyncAdapter(gasUrl, () => testToken);
  });
} else {
  describe.skip("GAS adapter contract tests", () => {
    it("skipped (no TEST_GAS_URL or TEST_TOKEN)", () => {});
  });
}
