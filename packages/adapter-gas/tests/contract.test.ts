import { describe, it } from "vitest";
import { syncAdapterContract } from "@clear-progress/contract/contracts";
import { GasSyncAdapter } from "../src/client";

// These tests require a real GAS endpoint and token
// Run only when environment variables are present
if (process.env.TEST_GAS_URL && process.env.TEST_TOKEN) {
	syncAdapterContract(async () => {
		const adapter = new GasSyncAdapter(
			process.env.TEST_GAS_URL!,
			() => process.env.TEST_TOKEN!,
		);
		return adapter;
	});
} else {
	describe.skip("GAS adapter contract tests", () => {
		it("skipped (no TEST_GAS_URL or TEST_TOKEN)", () => {});
	});
}
