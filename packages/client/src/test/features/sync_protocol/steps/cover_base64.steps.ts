// implements spec-sync-protocol — base64 conversion scenarios (FR10)
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";

const feature = await loadFeature("../cover_base64.feature");

// Helper function to convert base64 to Uint8Array (same as in FileSyncService)
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Uint8Array(bytes);
}

describeFeature(feature, (f) => {
  // @spec-sync-protocol @FR10
  f.Scenario(
    "Base64 string is correctly decoded to Uint8Array",
    ({ Given, When, Then, And }) => {
      const originalData = "fake image content for testing";
      let base64String = "";
      let result: Uint8Array | null = null;

      Given("a base64-encoded cover data string", async () => {
        base64String = btoa(originalData);
      });

      When("base64ToUint8Array is called", async () => {
        result = base64ToUint8Array(base64String);
      });

      Then("the result is a valid Uint8Array", async () => {
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).not.toBeNull();
      });

      And("the decoded bytes match the original data", async () => {
        // Convert Uint8Array back to string to verify correctness
        const decoder = new TextDecoder();
        const decodedString = decoder.decode(result as Uint8Array);
        expect(decodedString).toBe(originalData);
      });
    },
  );
});
