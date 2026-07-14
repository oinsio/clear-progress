import { describe, expect, it } from "vitest";
import { runAllChecks } from "../../../scripts/i18n-check";

describe("i18n consistency (NFR-I18N-1)", () => {
  it("code and locales are consistent: no undefined/unused/parity/orphan keys", () => {
    const { errors } = runAllChecks();
    expect(errors.map((e) => `[${e.kind}] ${e.key} — ${e.detail}`)).toEqual([]);
  });
});
